import _ from "lodash";

export function getQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const keys = urlParams.keys();
  let key = keys.next().value;
  const queryParams: Record<string, string> = {};
  while (key) {
    queryParams[key] = urlParams.get(key) as string;
    key = keys.next().value;
  }
  return queryParams;
}

export function convertObjectToQueryParams(object: any): string {
  if (!_.isNil(object)) {
    const paramArray: string[] = _.map(_.keys(object), (key) => {
      return encodeURIComponent(key) + "=" + encodeURIComponent(object[key]);
    });
    return "?" + _.join(paramArray, "&");
  } else {
    return "";
  }
}

export function isValidURL(url: string): boolean {
  return (
    url.match(
      /\(?(?:(http|https|ftp|mailto|tel):\/\/)?(?:((?:[^\W\s]|\.|-|[:]{1})+)@{1})?((?:www.)?(?:[^\W\s]|\.|-)+[\.][^\W\s]{2,4}|localhost(?=\/)|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?([\/]?[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]]*))?([\#][^\s\n]*)?\)?/g,
    ) !== null
  );
}

// update URL query params without reloading the page and changing current params
export function updateURLParams(params: Record<string, string>) {
  const urlParams = new URLSearchParams(window.location.search);
  for (const key in params) {
    urlParams.set(key, params[key]);
  }
  // check if hash is present in the url
  const hash = window.location.hash;
  window.history.replaceState(
    {},
    "",
    hash.includes("?") ? "&" : "?" + urlParams.toString(), // if hash is present, append params with & else append with ?
  );
}
