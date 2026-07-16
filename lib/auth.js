const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const https = require('https');

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'admin_token';

// Global cache for Gist config
let gistCache = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function createToken(payload) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

function verifyAuth(req) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }
  
  let token = null;

  // 1. Try to get token from Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Try to get token from httpOnly cookie
  if (!token && req.headers.cookie) {
    const cookies = cookie.parse(req.headers.cookie);
    token = cookies[COOKIE_NAME];
  }

  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired authentication token');
  }
}

function setAuthCookie(res, token) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7200 // 2 hours in seconds
  };
  
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, token, cookieOptions));
}

function clearAuthCookie(res) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0 // Expire immediately
  };
  
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', cookieOptions));
}

const fs = require('fs');
const path = require('path');

// Fetch helper with 5-minute memory cache
function fetchGistContent(gistId, token) {
  const now = Date.now();
  if (gistCache && now < cacheExpiry) {
    console.log('[GIST] Returning cached config');
    return Promise.resolve(gistCache);
  }

  // Fallback to local mock file for local testing if credentials are missing
  if (!gistId || !token || gistId === 'mock' || token === 'mock') {
    console.log('[GIST/MOCK] Running in local mock mode');
    const mockPath = path.join(__dirname, '..', 'coordinators_mock.json');
    if (!fs.existsSync(mockPath)) {
      // Create with default mock data if not existing (passcode '12345')
      const defaultMock = {
        'coordinators.json': [
          {
            username: 'sw_rep',
            name: 'Software Rep',
            department: 'sw',
            status: 'active',
            passwordHash: '$2a$10$nn1r/YCj07BfLdLyULx9Iu9ciE6NpUGRIRx.5PqT0Yf8IRu3TLJnm'
          }
        ]
      };
      fs.mkdirSync(path.dirname(mockPath), { recursive: true });
      fs.writeFileSync(mockPath, JSON.stringify(defaultMock, null, 2), 'utf8');
    }
    try {
      const data = JSON.parse(fs.readFileSync(mockPath, 'utf8'));
      gistCache = data;
      cacheExpiry = now + CACHE_TTL_MS;
      return Promise.resolve(data);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/gists/${gistId}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Vercel-Serverless-AdminPanel',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch Gist: Status ${res.statusCode}`));
          return;
        }

        try {
          const parsedGist = JSON.parse(data);
          const files = parsedGist.files || {};
          const result = {};
          
          for (const [filename, fileObj] of Object.entries(files)) {
            try {
              result[filename] = fileObj.content ? JSON.parse(fileObj.content) : null;
            } catch (e) {
              result[filename] = fileObj.content; // fallback to raw string
            }
          }

          gistCache = result;
          cacheExpiry = now + CACHE_TTL_MS;
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

// Write helper
function updateGistContent(gistId, filesUpdate, token) {
  if (!gistId || !token || gistId === 'mock' || token === 'mock') {
    console.log('[GIST/MOCK] Saving to local mock file');
    const mockPath = path.join(__dirname, '..', 'coordinators_mock.json');
    try {
      let currentMock = {};
      if (fs.existsSync(mockPath)) {
        currentMock = JSON.parse(fs.readFileSync(mockPath, 'utf8'));
      }
      for (const [filename, content] of Object.entries(filesUpdate)) {
        currentMock[filename] = typeof content === 'string' ? JSON.parse(content) : content;
      }
      fs.writeFileSync(mockPath, JSON.stringify(currentMock, null, 2), 'utf8');
      gistCache = null;
      cacheExpiry = 0;
      return Promise.resolve(true);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  return new Promise((resolve, reject) => {
    const files = {};
    for (const [filename, content] of Object.entries(filesUpdate)) {
      files[filename] = {
        content: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      };
    }

    const body = JSON.stringify({ files });

    const options = {
      hostname: 'api.github.com',
      path: `/gists/${gistId}`,
      method: 'PATCH',
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
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          reject(new Error(`Failed to update Gist: Status ${res.statusCode} ${data}`));
          return;
        }
        
        // Invalidate cache
        gistCache = null;
        cacheExpiry = 0;
        resolve(true);
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

module.exports = {
  createToken,
  verifyAuth,
  setAuthCookie,
  clearAuthCookie,
  fetchGistContent,
  updateGistContent,
  COOKIE_NAME
};
