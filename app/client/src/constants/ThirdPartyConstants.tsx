export type ENVIRONMENT = "PRODUCTION" | "STAGING" | "LOCAL";

export const DOCS_BASE_URL = "https://docs.appsmith.com/";
export const TELEMETRY_URL = `${DOCS_BASE_URL}telemetry`;
export const ASSETS_CDN_URL = "https://assets.appsmith.com";
export const GITHUB_RELEASE_URL =
  "https://github.com/appsmithorg/appsmith/releases/tag";
export const GET_RELEASE_NOTES_URL = (tagName: string) =>
  `${GITHUB_RELEASE_URL}/${tagName}`;
export const GOOGLE_MAPS_SETUP_DOC =
  "https://docs.appsmith.com/getting-started/setup/instance-configuration/google-maps";
export const GOOGLE_SIGNUP_SETUP_DOC =
  "https://docs.appsmith.com/getting-started/setup/instance-configuration/authentication/google-login";
export const GITHUB_SIGNUP_SETUP_DOC =
  "https://docs.appsmith.com/getting-started/setup/instance-configuration/authentication/github-login";
export const OIDC_SIGNUP_SETUP_DOC =
  "https://docs.appsmith.com/getting-started/setup/instance-configuration/authentication/openid-connect-oidc";
export const SAML_SIGNUP_SETUP_DOC =
  "https://docs.appsmith.com/getting-started/setup/instance-configuration/authentication/security-assertion-markup-language-saml";
export const EMAIL_SETUP_DOC =
  "https://docs.appsmith.com/getting-started/setup/instance-configuration/email";
export const SIGNUP_RESTRICTION_DOC =
  "https://docs.appsmith.com/getting-started/setup/instance-configuration/disable-user-signup#disable-sign-up";
