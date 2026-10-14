import { CategoryType } from "ee/pages/AdminSettings/config/types";
import { config, getMcpServerConfig } from "./mcpServer";

describe("getMcpServerConfig", () => {
  // Enabling MCP takes effect immediately: the internal secret the MCP service needs is generated at container
  // boot, and the toggle is enforced per request by the backend. Neither mode may ask for a restart.
  it("never asks for a restart in single-organization (instance) mode", () => {
    const instanceConfig = getMcpServerConfig(false);

    expect(instanceConfig.categoryType).toBe(CategoryType.INSTANCE);
    expect(instanceConfig.needsRestart).toBeUndefined();
    expect(instanceConfig.settings).toBe(config.settings);
  });

  it("returns the organization-scoped config unchanged in multi-organization mode", () => {
    const orgConfig = getMcpServerConfig(true);

    expect(orgConfig).toBe(config);
    expect(orgConfig.categoryType).toBe(CategoryType.ORGANIZATION);
    expect(orgConfig.needsRestart).toBeUndefined();
  });

  // The Profile → MCP keys entry is registered once at page load from the organization config, so a save must
  // reload the page for the entry to appear (or disappear) without the user refreshing by hand.
  it("reloads the page after a save in both modes", () => {
    expect(getMcpServerConfig(false).needsRefresh).toBe(true);
    expect(getMcpServerConfig(true).needsRefresh).toBe(true);
  });
});
