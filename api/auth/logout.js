const { handleCors } = require('../../lib/cors');
const { clearAuthCookie } = require('../../lib/auth');
const { sendError, logAndSendError } = require('../../lib/errors');

module.exports = async (req, res) => {
  // CORS check
  const isPreflight = handleCors(req, res, 'POST, OPTIONS');
  if (isPreflight) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    clearAuthCookie(res);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return logAndSendError(res, error, 'Logout Endpoint');
  }
};
