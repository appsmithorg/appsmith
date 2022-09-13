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
