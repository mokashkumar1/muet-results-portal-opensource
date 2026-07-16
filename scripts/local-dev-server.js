const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const bcrypt = require('bcryptjs');

// 1. Load `.env` file if it exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([\w.\-_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = (match[2] || '').trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            process.env[key] = value.trim();
        }
    });
    console.log('[DEV] Loaded environment variables from .env');
}

// 2. Set default environment variables for local testing if not present
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'local_dev_jwt_secret_key_1234567890';
    console.log('[DEV] Using default JWT_SECRET for local testing');
}
if (!process.env.ADMIN_PASSWORD_HASH) {
    const crypto = require('crypto');
    const randomPassword = crypto.randomBytes(12).toString('hex');
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(randomPassword, 10);
    console.log('\n============================================================');
    console.log('[DEV] No ADMIN_PASSWORD_HASH found in environment.');
    console.log(`[DEV] GENERATED TEMPORARY ADMIN PASSWORD: ${randomPassword}`);
    console.log('============================================================\n');
}

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    console.log(`[DEV] ${req.method} ${pathname}`);

    // Emulate Vercel API routing
    if (pathname.startsWith('/api/')) {
        // Intercept and proxy OCR requests to the local Python microservice
        if (pathname === '/api/extract-result') {
            console.log('[DEV] Proxying OCR request to local Python microservice (http://127.0.0.1:8000/ocr)...');
            const proxyReq = http.request({
                host: '127.0.0.1',
                port: 8000,
                path: '/ocr',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }, (proxyRes) => {
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res);
            });

            proxyReq.on('error', (err) => {
                console.error('[DEV] Proxy connection to Python OCR service failed. Is the Python service running on port 8000? Run `npm run ocr`. Details:', err.message);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Proxy Error',
                    message: 'Could not connect to the local Python OCR microservice on port 8000. Please start the Python service with `npm run ocr` and try again.',
                    details: err.message
                }));
            });

            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                proxyReq.write(body);
                proxyReq.end();
            });
            return;
        }

        // Map path to api file
        // e.g. /api/auth/login -> api/auth/login.js
        const apiPath = path.join(__dirname, '..', pathname + '.js');

        if (!fs.existsSync(apiPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `API endpoint ${pathname} not found` }));
            return;
        }

        try {
            // Clear require cache to enable live reload of API files
            delete require.cache[require.resolve(apiPath)];
            const handler = require(apiPath);

            // Read POST/PUT body if present
            let body = '';
            await new Promise((resolve) => {
                req.on('data', chunk => body += chunk);
                req.on('end', resolve);
            });

            // Parse body if JSON
            req.body = {};
            if (body) {
                try {
                    req.body = JSON.parse(body);
                } catch (e) {
                    req.body = body; // fallback to raw string
                }
            }

            // Decorate req/res for Vercel emulation
            res.status = function (statusCode) {
                this.statusCode = statusCode;
                return this;
            };

            res.json = function (data) {
                this.setHeader('Content-Type', 'application/json; charset=utf-8');
                this.end(JSON.stringify(data));
                return this;
            };

            res.send = function (data) {
                this.end(data);
                return this;
            };

            // Call handler
            await handler(req, res);
        } catch (error) {
            console.error('[DEV] API Error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error', message: error.message }));
        }
        return;
    }

    const DEPT_SLUGS = [
        "computer-science", "computer-systems-engineering", "architecture", "artificial-intelligence",
        "biomedical-engineering", "business-administration", "city-regional-planning", "civil-engineering",
        "cyber-security", "environmental-engineering", "electrical-engineering-technology", "electrical-engineering",
        "electronics-engineering", "environmental-sciences", "industrial-management-engineering", "mathematics",
        "mechanical-engineering", "mechatronics-engineering", "metallurgy-materials-engineering", "mining-engineering",
        "petroleum-natural-gas-engineering", "software-engineering", "telecommunication-engineering", "textile-engineering",
        "chemical-engineering"
    ];

    const VALID_SPA_ROUTES = [
        '/',
        '/about',
        '/faq',
        '/gpa-calculator',
        '/cgpa-calculator',
        '/grade-system',
        '/departments',
        '/privacy-policy',
        '/academic-calendar'
    ];

    function isValidSpaRoute(pathToCheck) {
        if (VALID_SPA_ROUTES.includes(pathToCheck)) return true;
        if (pathToCheck.startsWith('/ranking/') || pathToCheck.startsWith('/result/')) return true;
        const clean = pathToCheck.replace(/^\//, '');
        if (DEPT_SLUGS.includes(clean)) return true;
        return false;
    }

    // Rewrite routing rules based on vercel.json
    let isSpaRoute = isValidSpaRoute(pathname);
    let filePath = path.join(__dirname, '..', pathname);
    let fileExists = fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory();

    if (pathname === '/admin') {
        pathname = '/admin.html';
        filePath = path.join(__dirname, '..', pathname);
        fileExists = fs.existsSync(filePath);
    } else if (isSpaRoute) {
        // Serve index.html or pre-rendered static page if it exists
        // E.g., if /about has a pre-rendered about/index.html, serve that, otherwise fallback to root index.html
        const staticHtmlPath = path.join(__dirname, '..', pathname, 'index.html');
        if (fs.existsSync(staticHtmlPath)) {
            filePath = staticHtmlPath;
            fileExists = true;
        } else {
            pathname = '/index.html';
            filePath = path.join(__dirname, '..', pathname);
            fileExists = fs.existsSync(filePath);
        }
    }

    if (!fileExists) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1><p>The requested URL was not found on this server.</p>');
        return;
    }

    // Serve static file
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Apply headers locally for verification
    if (pathname.startsWith('/result/')) {
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error: ' + err.code);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

let port = PORT;

function startServer(p) {
    server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`[DEV] Port ${p} is in use, trying ${p + 1}...`);
            startServer(p + 1);
        } else {
            console.error('[DEV] Server error:', err);
        }
    });

    server.listen(p, () => {
        console.log('\n============================================================');
        console.log(`[DEV] Dev server running at http://localhost:${p}`);
        console.log('[DEV] Serverless API emulation active');
        console.log('[DEV] Static file serving active');
        console.log('============================================================\n');
    });
}

startServer(port);
