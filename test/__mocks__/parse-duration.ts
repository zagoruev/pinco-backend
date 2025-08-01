function parseDuration(str: string) {
  const match = str.match(/^(\d+)([dhmsMY])$/);
  if (!match) {
    return null;
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    M: 30 * 24 * 60 * 60 * 1000,
    Y: 365 * 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit as keyof typeof multipliers] || 1000);
}

export default parseDuration;
export { parseDuration };
