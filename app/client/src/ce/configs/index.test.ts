import { getAppsmithConfigs } from "./index";

const baseInjectedConfigs = {
  sentry: { dsn: "", release: "", environment: "" },
  smartLook: { id: "" },
  betterbugs: { apiKey: "" },
  segment: { apiKey: "", ceKey: "" },
  observability: { deploymentName: "", serviceInstanceId: "", tracingUrl: "" },
  fusioncharts: { licenseKey: "" },
  mixpanel: { enabled: false, apiKey: "" },
  googleRecaptchaSiteKey: "",
};

const setInjectedConfigs = (overrides: Record<string, unknown>) => {
  window.APPSMITH_FEATURE_CONFIGS = {
    ...baseInjectedConfigs,
    ...overrides,
  } as unknown as Window["APPSMITH_FEATURE_CONFIGS"];
};

describe("getAppsmithConfigs - disableHelpIcon", () => {
  const originalInjectedConfigs = window.APPSMITH_FEATURE_CONFIGS;
  const originalEnvValue = process.env.APPSMITH_DISABLE_HELP_ICON;

  beforeEach(() => {
    delete process.env.APPSMITH_DISABLE_HELP_ICON;
  });

  afterEach(() => {
    window.APPSMITH_FEATURE_CONFIGS = originalInjectedConfigs;

    if (originalEnvValue === undefined) {
      delete process.env.APPSMITH_DISABLE_HELP_ICON;
    } else {
      process.env.APPSMITH_DISABLE_HELP_ICON = originalEnvValue;
    }
  });

  it("is true when the injected config is true", () => {
    setInjectedConfigs({ disableHelpIcon: true });

    expect(getAppsmithConfigs().disableHelpIcon).toBe(true);
  });

  it("is false when the injected config is false", () => {
    setInjectedConfigs({ disableHelpIcon: false });

    expect(getAppsmithConfigs().disableHelpIcon).toBe(false);
  });

  it("defaults to false when the injected config is absent", () => {
    setInjectedConfigs({});

    expect(getAppsmithConfigs().disableHelpIcon).toBe(false);
  });

  it("is true when the build-time env var is set", () => {
    setInjectedConfigs({});
    process.env.APPSMITH_DISABLE_HELP_ICON = "true";

    expect(getAppsmithConfigs().disableHelpIcon).toBe(true);
  });
});
