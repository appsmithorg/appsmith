import { defineConfig } from "cypress";

export default defineConfig({
  watchForFileChanges: false,
  defaultCommandTimeout: 30000,
  requestTimeout: 60000,
  responseTimeout: 60000,
  pageLoadTimeout: 60000,
  videoUploadOnPasses: false,
  videoCompression: false,
  numTestsKeptInMemory: 5,
  experimentalMemoryManagement: true,
  reporterOptions: {
    reportDir: "results",
    overwrite: false,
    html: true,
    json: false,
  },
  chromeWebSecurity: false,
  viewportHeight: 1200,
  viewportWidth: 1400,
  scrollBehavior: "center",
  retries: {
    runMode: 1,
    openMode: 0,
  },
  e2e: {
    baseUrl: "http://localhost/",
    env: {
      USERNAME: "testowner@appsmith.com",
      PASSWORD: "hello@123",
      TEST_GITHUB_USER_NAME: "Vijetha-Kaja",
      GITHUB_PERSONAL_ACCESS_TOKEN: "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",
      GITEA_TOKEN: "fa1080b66dc0f7f5799dc7d274a446e902456937",
      TESTUSERNAME1: "testuser1@appsmith.com",
      TESTPASSWORD1: "hello@123",
      TESTUSERNAME2: "testuser2@appsmith.com",
      TESTPASSWORD2: "hello@123",
      TESTUSERNAME3: "cypresstestusername3@test.com",
      TESTUSERNAME4: "cypresstestusername4@test.com",
      OAUTH_SAML_REDIRECT_URL:
        "http://localhost/auth/realms/appsmith/broker/saml/endpoint",
      OAUTH_SAML_ENTITY_ID: "http://localhost/auth/realms/appsmith",
      OAUTH_SAML_METADATA_URL:
        "https://dev-6svpxmtbu58dbqva.us.auth0.com/samlp/metadata/Jp1BgIdN8aYweFIUZM98rSHJY31jM5SO",
      APPSMITH_OAUTH2_OIDC_CLIENT_ID: "8j5FRGaQ4SybrrgSNBsjhO2FjcrG8pdV",
      APPSMITH_OAUTH2_OIDC_CLIENT_SECRET:
        "f-hzcaA-VRUPa6ltkTQVK4O0IsOOh9jZKsHTsk0qZj4XLERHUANsQcxN_geywXKr",
      APPSMITH_OAUTH2_OIDC_AUTH_URL:
        "https://dev-6svpxmtbu58dbqva.us.auth0.com/authorize",
      APPSMITH_OAUTH2_OIDC_TOKEN_URL:
        "https://dev-6svpxmtbu58dbqva.us.auth0.com/oauth/token",
      APPSMITH_OAUTH2_OIDC_USER_INFO:
        "https://dev-6svpxmtbu58dbqva.us.auth0.com/userinfo",
      APPSMITH_OAUTH2_OIDC_JWKS_URL:
        "https://dev-6svpxmtbu58dbqva.us.auth0.com/.well-known/jwks.json",
      APPSMITH_OAUTH2_GITHUB_CLIENT_ID: "caccd1c37bee46a16785",
      APPSMITH_OAUTH2_GITHUB_CLIENT_SECRET:
        "b5fc5c1c5cc5421d470147f5391f76eab541b73d",
    },
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    specPattern: "cypress/e2e/**/*.{js,ts}",
    testIsolation: false,
    excludeSpecPattern: "cypress/e2e/**/spec_utility.ts",
  },
});
