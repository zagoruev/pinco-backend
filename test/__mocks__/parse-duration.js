function parseDuration(str) {
  // Simple mock that converts common duration strings to milliseconds
  const match = str.match(/^(\d+)([dhmsMY])$/);
  if (!match) {
    return null;
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
    'M': 30 * 24 * 60 * 60 * 1000,
    'Y': 365 * 24 * 60 * 60 * 1000
  };
  
  return value * (multipliers[unit] || 1000);
}

// Export as both default and named export
module.exports = parseDuration;
module.exports.default = parseDuration;