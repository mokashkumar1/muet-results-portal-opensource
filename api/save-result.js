const https = require('https');
const fs = require('fs');
const path = require('path');
const { handleCors } = require('../lib/cors');
const { checkRateLimit } = require('../lib/rate-limit');
const { verifyAuth } = require('../lib/auth');
const { saveSchema, validateBody } = require('../lib/validate');
const { sendError, logAndSendError } = require('../lib/errors');

// Helper to make GitHub API requests using native HTTPS module (zero dependencies!)
function githubRequest(path, method, body, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: method,
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'Vercel-Serverless-AdminPanel',
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = data ? JSON.parse(data) : null;
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, body: parsed });
            });
        });

        req.on('error', (err) => reject(err));
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

// Helper to append log history
async function appendUploadHistory(logEntry, token) {
    const logFilePath = 'logs/upload-history.json';
    const repoOwner = process.env.GITHUB_REPO_OWNER || 'your-github-username';
    const repoName = process.env.GITHUB_REPO_NAME || 'your-repo-name';
    
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
        attempts++;
        let currentSha = null;
        let currentLogs = [];
        
        const fetchRes = await githubRequest(
            `/repos/${repoOwner}/${repoName}/contents/${logFilePath}`,
            'GET',
            null,
            token
        );
        
        if (fetchRes.status === 200) {
            currentSha = fetchRes.body.sha;
            const rawContent = Buffer.from(fetchRes.body.content, 'base64').toString('utf8');
            try {
                currentLogs = JSON.parse(rawContent);
                if (!Array.isArray(currentLogs)) currentLogs = [];
            } catch (e) {
                currentLogs = [];
            }
        } else if (fetchRes.status !== 404) {
            await new Promise(r => setTimeout(r, 1500));
            continue;
        }
        
        currentLogs.push(logEntry);
        
        const newContentBase64 = Buffer.from(JSON.stringify(currentLogs, null, 2), 'utf8').toString('base64');
        const commitBody = {
            message: `Log upload history: ${logEntry.user} - ${logEntry.department}`,
            content: newContentBase64,
            branch: 'main'
        };
        if (currentSha) {
            commitBody.sha = currentSha;
        }
        
        const commitRes = await githubRequest(
            `/repos/${repoOwner}/${repoName}/contents/${logFilePath}`,
            'PUT',
            commitBody,
            token
        );
        
        if (commitRes.status === 200 || commitRes.status === 201) {
            console.log('Successfully wrote to upload-history.json');
            break;
        } else if (commitRes.status === 409) {
            console.warn(`Conflict writing to upload-history.json on attempt ${attempts}. Retrying...`);
            await new Promise(r => setTimeout(r, 1500));
        } else {
            console.error('Failed to write upload-history.json to GitHub:', commitRes.body);
            break;
        }
    }
}

module.exports = async (req, res) => {
    // CORS check
    const isPreflight = handleCors(req, res, 'POST, OPTIONS');
    if (isPreflight) return;

    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed');
    }

    // Auth check
    let token;
    try {
        token = verifyAuth(req);
    } catch (err) {
        return sendError(res, 401, 'Unauthorized: ' + err.message);
    }

    // Rate limit check (10 requests per 60 seconds)
    const rateLimitResult = checkRateLimit(req, { maxAttempts: 10, windowMs: 60000 });
    if (rateLimitResult.limited) {
        res.setHeader('Retry-After', Math.ceil(rateLimitResult.resetMs / 1000));
        return sendError(res, 429, 'Too many requests. Please try again later.');
    }

    // Request validation
    const validation = validateBody(saveSchema, req.body);
    if (!validation.success) {
        return sendError(res, 400, validation.error);
    }

    const { department, data } = validation.data;

    // Verify Coordinator constraints if role is coordinator
    if (token.role === 'coordinator') {
        if (!token.department || department.toLowerCase() !== token.department.toLowerCase()) {
            return sendError(res, 403, `Forbidden: Coordinator authorized only for department '${token.department.toUpperCase()}'`);
        }
    }

    // If data is empty, it's a successful auth check / heartbeat - return success immediately!
    if (!data || data.length === 0) {
        return res.status(200).json({ success: true, message: 'Authenticated successfully' });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        console.error('[SAVE] GITHUB_TOKEN is not configured in Vercel environment secrets.');
        return sendError(res, 500, 'GitHub service not configured.');
    }

    // Load departments mapping
    let departments = [];
    try {
        const deptsPath = path.join(__dirname, '..', 'config', 'departments.json');
        departments = JSON.parse(fs.readFileSync(deptsPath, 'utf8'));
    } catch (e) {
        console.error('[SAVE] Failed to load departments.json mapping:', e);
    }

    // Filter incoming data if logged in as coordinator
    let filteredData = data;
    if (token.role === 'coordinator') {
        const deptObj = departments.find(d => d.code.toLowerCase() === token.department.toLowerCase());
        const prefixes = deptObj ? deptObj.prefixes.map(p => p.toUpperCase()) : [token.department.toUpperCase()];
        
        filteredData = data.filter(student => {
            const id = student.id.trim().toUpperCase();
            const withoutYear = id.replace(/^\d+-?\d*/, "");
            return prefixes.some(prefix => withoutYear.startsWith(prefix));
        });

        if (filteredData.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No student records matching your authorized department were found. No updates committed.'
            });
        }
    }

    const repoOwner = process.env.GITHUB_REPO_OWNER || 'your-github-username';
    const repoName = process.env.GITHUB_REPO_NAME || 'your-repo-name';
    const csvFilePath = 'data/dummy_dataset.csv';

    let attempts = 0;
    const maxAttempts = 3;
    let commitRes = null;
    let csvCommitSha = null;

    try {
        while (attempts < maxAttempts) {
            attempts++;
            console.log(`Attempt ${attempts} to fetch, merge, and save CSV...`);

            // Fetch the current CSV file and its SHA from GitHub
            const fetchRes = await githubRequest(
                `/repos/${repoOwner}/${repoName}/contents/${csvFilePath}`,
                'GET',
                null,
                githubToken
            );

            if (fetchRes.status !== 200) {
                console.error(`Failed to fetch CSV from GitHub: Status ${fetchRes.status}`, fetchRes.body);
                if (attempts >= maxAttempts) {
                    return sendError(res, 500, 'Failed to fetch database file from storage.');
                }
                await new Promise(r => setTimeout(r, 1500));
                continue;
            }

            const fileSha = fetchRes.body.sha;
            const currentCsvBase64 = fetchRes.body.content;
            const currentCsvContent = Buffer.from(currentCsvBase64, 'base64').toString('utf8');

            // Parse CSV rows into structured map
            const csvLines = currentCsvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const studentMap = {};

            for (let i = 1; i < csvLines.length; i++) {
                const cols = csvLines[i].split(',').map(c => c.trim());
                const studentId = cols[0];
                if (!studentId) continue;

                studentMap[studentId] = {
                    Student_ID: studentId,
                    Batch: cols[1] || '',
                    Dept: cols[2] || '',
                    GPA_S1: cols[3] || '',
                    GPA_S2: cols[4] || '',
                    GPA_S3: cols[5] || '',
                    GPA_S4: cols[6] || '',
                    GPA_S5: cols[7] || '',
                    GPA_S6: cols[8] || '',
                    GPA_S7: cols[9] || '',
                    GPA_S8: cols[10] || ''
                };
            }

            // Merge incoming GPA updates
            filteredData.forEach(incoming => {
                const id = incoming.id.trim().toUpperCase();
                if (!id) return;

                // Determine Batch & Dept dynamically
                const batchMatch = id.match(/^(\d+)/);
                const batch = batchMatch ? batchMatch[1] : '';
                const deptMatch = id.match(/^(?:\d{2}(?:[\-]\d{2})?)([A-Z]+)/);
                const dept = deptMatch ? deptMatch[1] : 'CS';

                // Initialize record if missing
                if (!studentMap[id]) {
                    studentMap[id] = {
                        Student_ID: id,
                        Batch: batch,
                        Dept: dept,
                        GPA_S1: '', GPA_S2: '', GPA_S3: '', GPA_S4: '', GPA_S5: '', GPA_S6: '', GPA_S7: '', GPA_S8: ''
                    };
                }

                // Merge non-null GPAs (checking dynamically up to all 8 semesters)
                if (incoming.s1 !== undefined && incoming.s1 !== null) studentMap[id].GPA_S1 = incoming.s1.toFixed(2);
                if (incoming.s2 !== undefined && incoming.s2 !== null) studentMap[id].GPA_S2 = incoming.s2.toFixed(2);
                if (incoming.s3 !== undefined && incoming.s3 !== null) studentMap[id].GPA_S3 = incoming.s3.toFixed(2);
                if (incoming.s4 !== undefined && incoming.s4 !== null) studentMap[id].GPA_S4 = incoming.s4.toFixed(2);
                if (incoming.s5 !== undefined && incoming.s5 !== null) studentMap[id].GPA_S5 = incoming.s5.toFixed(2);
                if (incoming.s6 !== undefined && incoming.s6 !== null) studentMap[id].GPA_S6 = incoming.s6.toFixed(2);
                if (incoming.s7 !== undefined && incoming.s7 !== null) studentMap[id].GPA_S7 = incoming.s7.toFixed(2);
                if (incoming.s8 !== undefined && incoming.s8 !== null) studentMap[id].GPA_S8 = incoming.s8.toFixed(2);
            });

            // Re-sort all records (Batch first, BSCS before CS, then Roll number)
            const sortedStudentIds = Object.keys(studentMap).sort((a, b) => {
                const parseId = (id) => {
                    const batchMatch = id.match(/^(\d+)/);
                    const batch = batchMatch ? parseInt(batchMatch[1]) : 99;
                    const deptMatch = id.match(/^(?:\d{2}(?:[\-]\d{2})?)([A-Z]+)/);
                    const dept = deptMatch ? deptMatch[1] : 'CS';
                    const rollMatch = id.match(/(\d+)$/);
                    const roll = rollMatch ? parseInt(rollMatch[1]) : 999;
                    return { batch, dept, roll };
                };
                
                const infoA = parseId(a);
                const infoB = parseId(b);
                
                if (infoA.batch !== infoB.batch) return infoA.batch - infoB.batch;
                if (infoA.dept !== infoB.dept) {
                    return infoA.dept.localeCompare(infoB.dept);
                }
                return infoA.roll - infoB.roll;
            });

            // Build new CSV content
            let newCsvRows = [];
            newCsvRows.push('Student_ID,Batch,Dept,GPA_S1,GPA_S2,GPA_S3,GPA_S4,GPA_S5,GPA_S6,GPA_S7,GPA_S8');

            sortedStudentIds.forEach(id => {
                const r = studentMap[id];
                newCsvRows.push(`${r.Student_ID},${r.Batch},${r.Dept},${r.GPA_S1},${r.GPA_S2},${r.GPA_S3},${r.GPA_S4},${r.GPA_S5},${r.GPA_S6},${r.GPA_S7},${r.GPA_S8}`);
            });

            const newCsvContent = newCsvRows.join('\n') + '\n';
            const newCsvBase64 = Buffer.from(newCsvContent, 'utf8').toString('base64');

            // Commit the new CSV content back to GitHub
            const commitBody = {
                message: `Merge dynamic GPA scans from web panel`,
                content: newCsvBase64,
                sha: fileSha,
                branch: 'main'
            };

            commitRes = await githubRequest(
                `/repos/${repoOwner}/${repoName}/contents/${csvFilePath}`,
                'PUT',
                commitBody,
                githubToken
            );

            if (commitRes.status === 200 || commitRes.status === 201) {
                csvCommitSha = commitRes.body.commit.sha;
                console.log('Successfully committed merged CSV back to GitHub!');
                break;
            } else if (commitRes.status === 409) {
                console.warn(`Conflict (409) on attempt ${attempts}. Retrying in 1.5s...`);
                if (attempts >= maxAttempts) {
                    return sendError(res, 409, 'Failed to save updates due to concurrent conflicts. Please try again.');
                }
                await new Promise(r => setTimeout(r, 1500));
            } else {
                console.error(`Failed to commit CSV: Status ${commitRes.status}`, commitRes.body);
                if (attempts >= maxAttempts) {
                    return sendError(res, 500, 'Failed to save merged database updates.');
                }
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        // 4. Audit history logging
        const logEntry = {
            user: token.username || 'admin',
            department: department.toUpperCase(),
            studentsCount: filteredData.length,
            timestamp: new Date().toISOString(),
            commit: csvCommitSha || 'unknown'
        };

        // Async non-blocking call (or run it to ensure transparency logs get appended)
        appendUploadHistory(logEntry, githubToken).catch(err => {
            console.error('[SAVE] Failed to log upload history:', err);
        });

        console.log('Successfully committed merged CSV back to GitHub! Vercel auto-deploy triggered.');
        return res.status(200).json({ 
            success: true, 
            message: 'GPAs successfully merged and committed. Live deployment has started!' 
        });

    } catch (error) {
        return logAndSendError(res, error, 'GitHub Save Endpoint');
    }
};
