export const is404orAuthPath = () => {
  const pathName = window.location.pathname;

  return /^\/404/.test(pathName) || /^\/user\/\w+/.test(pathName);
};
