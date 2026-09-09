import {
  flattenOrganizationConfigForSettingsForm,
  isOrganizationConfig,
  nestOrganizationConfigFromSettingsForm,
} from "./adminSettingsHelpers";

describe("MCP org config form mapping", () => {
  it("treats nested mcpConfig form fields as organization settings", () => {
    expect(isOrganizationConfig("mcpConfig.enabled")).toBe(true);
    expect(isOrganizationConfig("APPSMITH_MCP_ENABLED")).toBe(false);
  });

  it("flattens mcpConfig.enabled onto dotted form keys and fail-closes missing flags", () => {
    expect(
      flattenOrganizationConfigForSettingsForm({
        instanceName: "Appsmith",
        mcpConfig: {
          enabled: true,
        },
      }),
    ).toEqual({
      instanceName: "Appsmith",
      "mcpConfig.enabled": true,
      mcpConfig: {
        enabled: true,
      },
    });
  });

  it("nests only changed mcpConfig fields on save", () => {
    expect(
      nestOrganizationConfigFromSettingsForm({
        "mcpConfig.enabled": true,
        hideWatermark: true,
      }),
    ).toEqual({
      hideWatermark: true,
      mcpConfig: { enabled: true },
    });
  });
});
