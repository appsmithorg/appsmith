import {
  flattenOrganizationConfigForSettingsForm,
  isOrganizationConfig,
  nestOrganizationConfigFromSettingsForm,
} from "./adminSettingsHelpers";

describe("MCP org config form mapping", () => {
  it("treats nested mcpConfig form fields as organization settings", () => {
    expect(isOrganizationConfig("mcpConfig.enabled")).toBe(true);
    expect(isOrganizationConfig("mcpConfig.dataEnabled")).toBe(true);
    expect(isOrganizationConfig("mcpConfig.serverUrl")).toBe(true);
    expect(isOrganizationConfig("APPSMITH_MCP_ENABLED")).toBe(false);
  });

  it("flattens mcpConfig onto dotted form keys and fail-closes missing flags", () => {
    expect(
      flattenOrganizationConfigForSettingsForm({
        instanceName: "Appsmith",
        mcpConfig: {
          enabled: true,
          dataEnabled: false,
          serverUrl: "https://appsmith.example/mcp",
        },
      }),
    ).toEqual({
      instanceName: "Appsmith",
      "mcpConfig.enabled": true,
      "mcpConfig.dataEnabled": false,
      "mcpConfig.serverUrl": "https://appsmith.example/mcp",
      mcpConfig: {
        enabled: true,
        dataEnabled: false,
        serverUrl: "https://appsmith.example/mcp",
      },
    });
  });

  it("nests only changed mcpConfig fields on save", () => {
    expect(
      nestOrganizationConfigFromSettingsForm({
        "mcpConfig.dataEnabled": true,
        hideWatermark: true,
      }),
    ).toEqual({
      hideWatermark: true,
      mcpConfig: { dataEnabled: true },
    });
  });
});
