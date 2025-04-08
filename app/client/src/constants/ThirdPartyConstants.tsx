export type ENVIRONMENT = "PRODUCTION" | "STAGING" | "LOCAL";

export const DOCS_BASE_URL = "https://docs.appsmith.com/";
export const DOCS_AI_BASE_URL = "https://docs.appsmithai.com/";
export const TELEMETRY_URL = `${DOCS_BASE_URL}telemetry`;
export const ASSETS_CDN_URL = "https://assets.appsmith.com";
export const GITHUB_RELEASE_URL =
  "https://github.com/appsmithorg/appsmith/releases/tag";
export const GET_RELEASE_NOTES_URL = (tagName: string) =>
  `${GITHUB_RELEASE_URL}/${tagName}`;
export const SELF_HOSTING_DOC =
  "https://docs.appsmith.com/getting-started/setup";
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
export const EMBED_PRIVATE_APPS_DOC =
  "https://docs.appsmith.com/advanced-concepts/embed-appsmith-into-existing-application#embedding-private-apps";
export const PROVISIONING_SETUP_DOC =
  "http://docs.appsmith.com/advanced-concepts/user-provisioning-group-sync";
export const DISCORD_URL = "https://discord.gg/rBTTVJp";
export const ENTERPRISE_PRICING_PAGE = "https://www.appsmith.com/enterprise";
export const DOCS_BRANCH_PROTECTION_URL =
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git/reference/git-settings#branch-protection";
export const DOCS_DEFAULT_BRANCH_URL =
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git/working-with-branches#default-branch";
export const PACKAGES_OVERVIEW_DOC =
  "https://docs.appsmith.com/packages/overview";

export const PRICING_PAGE_URL = (
  URL: string,
  source: string,
  instanceId: string,
  feature?: string,
  section?: string,
) =>
  `${URL}?source=${source}${instanceId ? `&instance=${instanceId}` : ``}${
    feature ? `&feature=${feature}` : ""
  }${section ? `&section=${section}` : ""}`;

export const CUSTOMER_PORTAL_URL_WITH_PARAMS = (
  URL: string,
  source: string,
  instanceId: string,
  feature?: string,
  section?: string,
) =>
  `${URL}?source=${source}${instanceId ? `&instance=${instanceId}` : ``}${
    feature ? `&feature=${feature}` : ""
  }${section ? `&section=${section}` : ""}`;
