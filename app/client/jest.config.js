function parseConfig() {
  return "";
}
const LOG_LEVELS = ["debug", "error"];
const CONFIG_LOG_LEVEL_INDEX = 1;

module.exports = {
  setupFiles: ["jest-canvas-mock"],
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(png|js|ts|tsx)$": "ts-jest",
  },
  testEnvironment: "jsdom",
  testTimeout: 9000,
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx|ts|js)?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "css"],
  moduleDirectories: ["node_modules", "src", "test"],
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!codemirror|design-system-old|react-dnd|dnd-core|@babel|(@blueprintjs/core/lib/esnext)|(@blueprintjs/core/lib/esm)|@github|lodash-es|@draft-js-plugins|react-documents|linkedom)",
  ],
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/test/__mocks__/styleMock.js",
    "\\.svg$": "<rootDir>/test/__mocks__/svgMock.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/test/__mocks__/fileMock.js",
    "^worker-loader!": "<rootDir>/test/__mocks__/workerMock.js",
    "^!!raw-loader!": "<rootDir>/test/__mocks__/derivedMock.js",
    "test/(.*)": "<rootDir>/test/$1",
    "@appsmith/(.*)": "<rootDir>/src/ee/$1",
    "design-system-old": "<rootDir>/node_modules/design-system-old/build",
    "^proxy-memoize$": "<rootDir>/node_modules/proxy-memoize/dist/wrapper.cjs",
  },
  globals: {
    "ts-jest": {
      isolatedModules: true,
      diagnostics: {
        ignoreCodes: [1343],
      },
      astTransformers: {
        before: [
          {
            path: "node_modules/ts-jest-mock-import-meta",
            options: { metaObjectReplacement: { url: "https://www.url.com" } },
          },
        ],
      },
    },
    APPSMITH_FEATURE_CONFIGS: {
      sentry: {
        dsn: parseConfig("__APPSMITH_SENTRY_DSN__"),
        release: parseConfig("__APPSMITH_SENTRY_RELEASE__"),
        environment: parseConfig("__APPSMITH_SENTRY_ENVIRONMENT__"),
      },
      smartLook: {
        id: parseConfig("__APPSMITH_SMART_LOOK_ID__"),
      },
      disableLoginForm: parseConfig("__APPSMITH_FORM_LOGIN_DISABLED__"),
      disableSignup: parseConfig("__APPSMITH_SIGNUP_DISABLED__"),
      enableRapidAPI: parseConfig("__APPSMITH_MARKETPLACE_ENABLED__"),
      segment: {
        apiKey: parseConfig("__APPSMITH_SEGMENT_KEY__"),
        ceKey: parseConfig("__APPSMITH_SEGMENT_CE_KEY__"),
      },
      fusioncharts: {
        licenseKey: parseConfig("__APPSMITH_FUSIONCHARTS_LICENSE_KEY__"),
      },
      enableMixpanel: parseConfig("__APPSMITH_SEGMENT_KEY__"),
      algolia: {
        apiId: parseConfig("__APPSMITH_ALGOLIA_API_ID__"),
        apiKey: parseConfig("__APPSMITH_ALGOLIA_API_KEY__"),
        indexName: parseConfig("__APPSMITH_ALGOLIA_SEARCH_INDEX_NAME__"),
      },
      logLevel:
        CONFIG_LOG_LEVEL_INDEX > -1
          ? LOG_LEVELS[CONFIG_LOG_LEVEL_INDEX]
          : LOG_LEVELS[1],
      cloudHosting: "CLOUD_HOSTING",
      enableTNCPP: parseConfig("__APPSMITH_TNC_PP__"),
      appVersion: {
        id: parseConfig("__APPSMITH_VERSION_ID__"),
        releaseDate: parseConfig("__APPSMITH_VERSION_RELEASE_DATE__"),
      },
      intercomAppID: "APP_ID",
      mailEnabled: parseConfig("__APPSMITH_MAIL_ENABLED__"),

      hideWatermark: parseConfig("__APPSMITH_HIDE_WATERMARK__"),
      disableIframeWidgetSandbox: parseConfig(
        "__APPSMITH_DISABLE_IFRAME_WIDGET_SANDBOX__",
      ),
    },
  },
};
