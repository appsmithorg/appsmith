/**
 * add http if missing
 *
 * @param url
 * @returns
 */
export const addHttpIfMissing = (url: string) => {
  if (!url) {
    return url;
  }
  if (url.indexOf("http") === 0) {
    return url;
  }
  return `http://${url}`;
};
