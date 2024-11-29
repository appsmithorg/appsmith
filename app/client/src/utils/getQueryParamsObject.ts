import log from "loglevel";

/**
 * get query params object
 * ref: https://stackoverflow.com/a/8649003/1543567
 */
export const getQueryParamsFromString = (search: string | undefined) => {
  if (!search) return {};

  try {
    return Object.fromEntries(new URLSearchParams(search).entries());
  } catch (e) {
    log.error(e, "error parsing search string");

    return {};
  }
};

export default function () {
  return getQueryParamsFromString(window.location.search.substring(1));
}
