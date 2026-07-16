const bcrypt = require('bcryptjs');
const { handleCors } = require('../../lib/cors');
const { verifyAuth, fetchGistContent, updateGistContent } = require('../../lib/auth');
const { sendError, logAndSendError } = require('../../lib/errors');

module.exports = async (req, res) => {
  // CORS check
  const isPreflight = handleCors(req, res, 'GET, POST, OPTIONS');
  if (isPreflight) return;

  // Verify Admin Authentication
  let token;
  try {
    token = verifyAuth(req);
    if (token.role !== 'admin') {
      return sendError(res, 403, 'Forbidden: Admin access required');
    }
  } catch (err) {
    return sendError(res, 401, 'Unauthorized: ' + err.message);
  }

  const gistId = process.env.COORDINATORS_GIST_ID;
  const githubToken = process.env.GITHUB_TOKEN;
  if (!gistId || !githubToken) {
    return sendError(res, 500, 'Coordinator service is not configured on this server.');
  }

  try {
    // 1. GET Coordinators
    if (req.method === 'GET') {
      const gistFiles = await fetchGistContent(gistId, githubToken);
      const coordinators = gistFiles['coordinators.json'] || [];
      // Strip passwordHash before sending
      const safeCoordinators = coordinators.map(c => ({
        username: c.username,
        name: c.name,
        department: c.department,
        status: c.status || 'active'
      }));
      return res.status(200).json({ success: true, coordinators: safeCoordinators });
    }

    // 2. POST actions
    if (req.method === 'POST') {
      const { action, username, name, department, password } = req.body;
      if (!action) {
        return sendError(res, 400, 'Action is required');
      }

      // Fetch existing
      const gistFiles = await fetchGistContent(gistId, githubToken);
      let coordinators = gistFiles['coordinators.json'] || [];

      if (action === 'add') {
        if (!username || !name || !department || !password) {
          return sendError(res, 400, 'All fields (username, name, department, password) are required');
        }
        const normUser = username.trim().toLowerCase();
        if (coordinators.some(c => c.username.toLowerCase() === normUser)) {
          return sendError(res, 400, 'Username already exists');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        coordinators.push({
          username: username.trim(),
          name: name.trim(),
          department: department.trim(),
          status: 'active',
          passwordHash
        });
      }
      else if (action === 'delete') {
        if (!username) {
          return sendError(res, 400, 'Username is required');
        }
        const normUser = username.trim().toLowerCase();
        coordinators = coordinators.filter(c => c.username.toLowerCase() !== normUser);
      }
      else if (action === 'toggle') {
        if (!username) {
          return sendError(res, 400, 'Username is required');
        }
        const normUser = username.trim().toLowerCase();
        const coord = coordinators.find(c => c.username.toLowerCase() === normUser);
        if (!coord) {
          return sendError(res, 404, 'Coordinator not found');
        }
        coord.status = coord.status === 'active' ? 'disabled' : 'active';
      }
      else if (action === 'reset-password') {
        if (!username || !password) {
          return sendError(res, 400, 'Username and new password are required');
        }
        const normUser = username.trim().toLowerCase();
        const coord = coordinators.find(c => c.username.toLowerCase() === normUser);
        if (!coord) {
          return sendError(res, 404, 'Coordinator not found');
        }
        coord.passwordHash = await bcrypt.hash(password, 10);
      }
      else {
        return sendError(res, 400, 'Invalid action');
      }

      // Save back to Gist
      await updateGistContent(gistId, { 'coordinators.json': coordinators }, githubToken);
      
      return res.status(200).json({ success: true, message: `Coordinator action '${action}' completed successfully.` });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return logAndSendError(res, error, 'Admin Coordinators Endpoint');
  }
};
