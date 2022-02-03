export type ENVIRONMENT = "PRODUCTION" | "STAGING" | "LOCAL";

export const DOCS_BASE_URL = "https://docs.appsmith.com/";
export const TELEMETRY_URL = `${DOCS_BASE_URL}telemetry`;
export const ASSETS_CDN_URL = "https://assets.appsmith.com";
export const GITHUB_RELEASE_URL =
  "https://github.com/appsmithorg/appsmith/releases/tag";
export const GET_RELEASE_NOTES_URL = (tagName: string) =>
  `${GITHUB_RELEASE_URL}/${tagName}`;
export const GOOGLE_MAPS_SETUP_DOC =
  "https://docs.appsmith.com/setup/instance-configuration/google-maps";
export const GOOGLE_SIGNUP_SETUP_DOC =
  "https://docs.appsmith.com/setup/instance-configuration/google-login";
export const GITHUB_SIGNUP_SETUP_DOC =
  "https://docs.appsmith.com/setup/instance-configuration/github-login";
export const EMAIL_SETUP_DOC =
  "https://docs.appsmith.com/setup/instance-configuration/email";
