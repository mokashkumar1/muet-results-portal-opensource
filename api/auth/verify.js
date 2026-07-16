const { handleCors } = require('../../lib/cors');
const { verifyAuth } = require('../../lib/auth');
const { sendError } = require('../../lib/errors');

module.exports = async (req, res) => {
  // CORS check (Allow GET and OPTIONS)
  const isPreflight = handleCors(req, res, 'GET, OPTIONS');
  if (isPreflight) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const decoded = verifyAuth(req);
    return res.status(200).json({ 
      authenticated: true, 
      role: decoded.role,
      department: decoded.department,
      name: decoded.name
    });
  } catch (error) {
    return res.status(401).json({ authenticated: false, error: 'Unauthorized: Session invalid or expired' });
  }
};
