const https = require('https');
const { handleCors } = require('../lib/cors');
const { checkRateLimit } = require('../lib/rate-limit');
const { verifyAuth } = require('../lib/auth');
const { extractSchema, validateBody } = require('../lib/validate');
const { sendError, logAndSendError } = require('../lib/errors');

// Helper to make native HTTPS REST requests directly to Google Gemini API (Zero SDK dependency!)
function geminiRestRequest(apiKey, model, prompt, base64Data, mimeType) {
    return new Promise((resolve, reject) => {
        const payload = {
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        };

        const postData = JSON.stringify(payload);
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1/models/${model}:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ statusCode: res.statusCode, body: parsed });
            });
        });

        req.on('error', (err) => reject(err));
        req.write(postData);
        req.end();
    });
}

// Robust JSON extractor helper to parse LLM response cleanly
function extractJson(text) {
    const startChar = '{';
    const endChar = '}';
    const startIndex = text.indexOf(startChar);
    const endIndex = text.lastIndexOf(endChar);
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        return text.substring(startIndex, endIndex + 1);
    }
    return text;
}

module.exports = async (req, res) => {
    // CORS check
    const isPreflight = handleCors(req, res, 'POST, OPTIONS');
    if (isPreflight) return;

    if (req.method !== 'POST') {
        return sendError(res, 405, 'Method not allowed');
    }

    // Auth check
    try {
        verifyAuth(req);
    } catch (err) {
        return sendError(res, 401, 'Unauthorized: ' + err.message);
    }

    // Rate limit check (10 requests per 60 seconds)
    const rateLimitResult = checkRateLimit(req, { maxAttempts: 10, windowMs: 60000 });
    if (rateLimitResult.limited) {
        res.setHeader('Retry-After', Math.ceil(rateLimitResult.resetMs / 1000));
        return sendError(res, 429, 'Too many requests. Please try again later.');
    }

    // Input validation
    const validation = validateBody(extractSchema, req.body);
    if (!validation.success) {
        return sendError(res, 400, validation.error);
    }

    const { image } = validation.data;

    try {
        // Decode the base64 image data
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const mimeType = matches[1];
        const base64Data = matches[2];

        // Initialize API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return sendError(res, 500, 'OCR service key not configured.');
        }

        const prompt = `
Analyze this official Mehran University of Engineering and Technology (MUET) result announcement table.
Perform the following steps:
1. Identify which semester this announcement is for (e.g., 'FIRST SEMESTER', 'SECOND SEMESTER', 'THIRD SEMESTER', 'FOURTH SEMESTER', 'FIFTH SEMESTER').
2. Parse the table columns carefully. The table has ID.No and G.P.A columns side-by-side in repeating patterns.
3. For every successful student ID, extract their official Roll Number ID and their corresponding GPA value.
4. Output a clean JSON array of results under the key "results".
   For each student:
   - "id": The student ID string (e.g. "24CS030", "24-23CS075").
   - Based on which semester is announced:
     * If it is 1st Semester: set the GPA value to "s1". Leave "s2", "s3", "s4", "s5" as null.
     * If it is 2nd Semester: set the GPA value to "s2". Leave "s1", "s3", "s4", "s5" as null.
     * If it is 3rd Semester: set the GPA value to "s3". Leave "s1", "s2", "s4", "s5" as null.
     * If it is 4th Semester: set the GPA value to "s4". Leave "s1", "s2", "s3", "s5" as null.
     * If it is 5th Semester: set the GPA value to "s5". Leave "s1", "s2", "s3", "s4" as null.

Ensure to output ONLY valid raw JSON in this structure, without any markdown formatting blocks or surrounding text:
{
  "results": [
    { "id": "24CS001", "s1": null, "s2": 3.03, "s3": null, "s4": null, "s5": null },
    ...
  ]
}
`;

        let geminiRes;
        let selectedModel = 'gemini-1.5-flash';

        console.log(`[REST] Querying Gemini model: ${selectedModel}...`);
        
        // 1. Try Gemini 1.5 Flash
        geminiRes = await geminiRestRequest(apiKey, selectedModel, prompt, base64Data, mimeType);

        // 2. Fallback: If Flash fails (e.g. not found/supported), try Gemini 1.5 Pro
        if (geminiRes.statusCode !== 200) {
            console.warn(`[REST] ${selectedModel} failed with status ${geminiRes.statusCode}. Trying fallback model gemini-1.5-pro...`, geminiRes.body);
            selectedModel = 'gemini-1.5-pro';
            geminiRes = await geminiRestRequest(apiKey, selectedModel, prompt, base64Data, mimeType);
        }

        // 3. Fallback: Try classic gemini-pro if needed
        if (geminiRes.statusCode !== 200) {
            console.warn(`[REST] ${selectedModel} failed. Trying fallback model gemini-pro...`);
            selectedModel = 'gemini-pro';
            geminiRes = await geminiRestRequest(apiKey, selectedModel, prompt, base64Data, mimeType);
        }

        if (geminiRes.statusCode !== 200) {
            console.error('[REST] Gemini API requests failed completely.', geminiRes.body);
            return sendError(res, 500, 'Failed to extract text using Gemini API endpoints.');
        }

        const candidates = geminiRes.body.candidates;
        if (!candidates || candidates.length === 0 || !candidates[0].content || !candidates[0].content.parts || candidates[0].content.parts.length === 0) {
            console.error('[REST] Empty or malformed candidates in Gemini response:', geminiRes.body);
            return sendError(res, 500, 'Gemini returned an empty or unparsable response.');
        }

        const responseText = candidates[0].content.parts[0].text.trim();
        
        // Parse JSON safely using robust extraction helper
        const cleanJsonText = extractJson(responseText).trim();
        const parsedData = JSON.parse(cleanJsonText);
        return res.status(200).json(parsedData);

    } catch (error) {
        return logAndSendError(res, error, 'Gemini OCR Endpoint');
    }
};
