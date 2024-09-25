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

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  try {
    new URL(url);

    return true;
  } catch (e) {
    return false;
  }
}

export function matchesURLPattern(url: string) {
  return (
    url.match(
      /\(?(?:(http|https|ftp|mailto|tel):\/\/)?(?:((?:[^\W\s]|\.|-|[:]{1})+)@{1})?((?:www.)?(?:[^\W\s]|\.|-)+[\.][^\W\s]{2,4}|localhost(?=\/)|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d*))?([\/]?[^\s\?]*[\/]{1})*(?:\/?([^\s\n\?\[\]\{\}\#]*(?:(?=\.)){1}|[^\s\n\?\[\]\{\}\.\#]*)?([\.]{1}[^\s\?\#]*)?)?(?:\?{1}([^\s\n\#\[\]]*))?([\#][^\s\n]*)?\)?/g,
    ) !== null
  );
}

export const sanitizeString = (str: string): string => {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "_");
};
