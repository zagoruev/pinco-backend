export const isResolveAdded = (message: string): boolean => {
  return message.includes('{{{resolved}}}');
};
