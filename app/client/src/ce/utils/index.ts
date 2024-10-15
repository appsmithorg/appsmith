import _ from "lodash";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getHtmlPageTitle = (instanceName: string) => {
  return "YuChat Admin";
};

export const isCEMode = () => {
  return true;
};

export const getPageTitle = (
  displayName?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  titleSuffix?: string,
) => {
  return `${displayName ? `${displayName} | ` : ""}YuChat Admin`;
};

// TODO: Remove this function once we have a better way to handle this
// get only the part of the url after the domain name
export const to = (url: string) => {
  const path = _.drop(
    url
      .toString()
      .replace(/([a-z])?:\/\//, "$1")
      .split("/"),
  ).join("/");
  return `/${path}`;
};

export const defaultOptionSelected = "";

export function getSnippetUrl(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPublicApp: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  method: string,
) {
  return url;
}
