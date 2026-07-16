function sendError(res, statusCode, publicMessage) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json({ error: publicMessage });
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({ error: publicMessage }));
}

function logAndSendError(res, error, context = 'API Error') {
  console.error(`[${context}] Detailed Error:`, error);
  
  const statusCode = error.statusCode || 500;
  const publicMessage = error.isPublic ? error.message : 'An internal server error occurred. Please contact the administrator.';

  return sendError(res, statusCode, publicMessage);
}

module.exports = {
  sendError,
  logAndSendError
};
