import log from "loglevel";

/**
 * get query params object
 * ref: https://stackoverflow.com/a/8649003/1543567
 */
const getQueryParamsObject = () => {
  const search = window.location.search.substring(1);
  if (!search) return {};
  try {
    return JSON.parse(
      '{"' +
        decodeURI(search)
          .replace(/"/g, '\\"')
          .replace(/&/g, '","')
          .replace(/=/g, '":"') +
        '"}',
    );
  } catch (e) {
    log.error(e, "error parsing search string");
    return {};
  }
};

export default getQueryParamsObject;
