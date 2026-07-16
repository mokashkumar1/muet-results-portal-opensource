const bcrypt = require('bcryptjs');
const { handleCors } = require('../../lib/cors');
const { checkRateLimit } = require('../../lib/rate-limit');
const { createToken, setAuthCookie, fetchGistContent } = require('../../lib/auth');
const { loginSchema, validateBody } = require('../../lib/validate');
const { sendError, logAndSendError } = require('../../lib/errors');

module.exports = async (req, res) => {
  // CORS check
  const isPreflight = handleCors(req, res, 'POST, OPTIONS');
  if (isPreflight) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  // Rate limit (5 attempts per 60 seconds)
  const rateLimitResult = checkRateLimit(req, { maxAttempts: 5, windowMs: 60000 });
  if (rateLimitResult.limited) {
    res.setHeader('Retry-After', Math.ceil(rateLimitResult.resetMs / 1000));
    return sendError(res, 429, 'Too many login attempts. Please try again later.');
  }

  try {
    // Request body validation
    const validation = validateBody(loginSchema, req.body);
    if (!validation.success) {
      return sendError(res, 400, validation.error);
    }

    const { username, password } = validation.data;
    
    // 1. COORDINATOR LOGIN
    if (username && username.trim().length > 0) {
      const normalizedUsername = username.trim().toLowerCase();
      const gistId = process.env.COORDINATORS_GIST_ID;
      const githubToken = process.env.GITHUB_TOKEN;

      if (!gistId || !githubToken) {
        console.error('[AUTH] Coordinator credentials Gist or GitHub token is not configured.');
        return sendError(res, 500, 'Coordinator service is not configured on this server.');
      }

      // Fetch coordinators list from private Gist
      let gistFiles;
      try {
        gistFiles = await fetchGistContent(gistId, githubToken);
      } catch (err) {
        console.error('[AUTH] Failed to fetch Gist coordinators config:', err);
        return sendError(res, 500, 'Failed to fetch credentials database.');
      }

      const coordinators = gistFiles['coordinators.json'] || [];
      const user = coordinators.find(c => c.username && c.username.toLowerCase() === normalizedUsername);

      if (!user) {
        // Slow down slightly to mitigate timing attacks
        await new Promise(resolve => setTimeout(resolve, 500));
        return sendError(res, 401, 'Invalid credentials');
      }

      if (user.status !== 'active') {
        return sendError(res, 403, 'Account is disabled or pending approval. Contact Supervisor.');
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return sendError(res, 401, 'Invalid credentials');
      }

      // Coordinator success - Issue role-based token
      const token = createToken({
        role: 'coordinator',
        username: user.username,
        department: user.department.toLowerCase(),
        name: user.name,
        authenticatedAt: Date.now()
      });
      setAuthCookie(res, token);

      return res.status(200).json({ 
        success: true, 
        message: 'Login successful', 
        role: 'coordinator', 
        department: user.department.toLowerCase(),
        name: user.name 
      });
    }

    // 2. SUPER ADMIN LOGIN (Fallback if username is empty)
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!passwordHash) {
      console.error('[AUTH] ADMIN_PASSWORD_HASH is not defined in environment variables.');
      return sendError(res, 500, 'Authentication system misconfigured. Please set ADMIN_PASSWORD_HASH.');
    }

    const match = await bcrypt.compare(password, passwordHash);
    if (!match) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return sendError(res, 401, 'Invalid credentials');
    }

    // Admin success - Issue full admin token
    const token = createToken({ 
      role: 'admin', 
      authenticatedAt: Date.now() 
    });
    setAuthCookie(res, token);

    return res.status(200).json({ 
      success: true, 
      message: 'Login successful', 
      role: 'admin' 
    });
  } catch (error) {
    return logAndSendError(res, error, 'Login Endpoint');
  }
};
