const ipStore = new Map();

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function checkRateLimit(req, options = {}) {
  const maxAttempts = options.maxAttempts || 10;
  const windowMs = options.windowMs || 60000;
  
  const ip = getClientIp(req);
  const now = Date.now();
  
  // Auto-clean expired entries from memory occasionally to prevent leaks
  if (Math.random() < 0.1) {
    for (const [key, timestamps] of ipStore.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < windowMs);
      if (validTimestamps.length === 0) {
        ipStore.delete(key);
      } else {
        ipStore.set(key, validTimestamps);
      }
    }
  }

  let timestamps = ipStore.get(ip) || [];
  
  // Filter timestamps within window
  timestamps = timestamps.filter(t => now - t < windowMs);
  
  if (timestamps.length >= maxAttempts) {
    ipStore.set(ip, timestamps);
    return {
      limited: true,
      remaining: 0,
      resetMs: Math.max(0, windowMs - (now - timestamps[0]))
    };
  }
  
  timestamps.push(now);
  ipStore.set(ip, timestamps);
  
  return {
    limited: false,
    remaining: maxAttempts - timestamps.length,
    resetMs: windowMs
  };
}

module.exports = {
  checkRateLimit,
  getClientIp
};
