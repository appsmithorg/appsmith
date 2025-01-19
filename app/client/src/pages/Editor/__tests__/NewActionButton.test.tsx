import "@testing-library/jest-dom";
import { PluginType } from "entities/Plugin";
import type { Datasource } from "entities/Datasource";
import { apiPluginHasUrl } from "../DataSourceEditor/NewActionButton";

const datasourceWithUrl: Datasource = {
  id: "test",
  datasourceStorages: {
    env1: {
      datasourceId: "test",
      environmentId: "env1",
      datasourceConfiguration: {
        url: "https://example.com",
      },
      isValid: false,
    },
  },
  pluginId: "plugin",
  workspaceId: "workspace",
  name: "datasource1",
};

const datasourceWithoutUrl: Datasource = {
  id: "test",
  datasourceStorages: {
    env1: {
      datasourceId: "test",
      environmentId: "env1",
      datasourceConfiguration: {
        url: "",
      },
      isValid: false,
    },
  },
  pluginId: "plugin",
  workspaceId: "workspace",
  name: "datasource1",
};

describe("New Action Button Component", () => {
  // Positive case where everything is correct in datasource / Plugin type is different, basically no error
  it("1. Plugin type is API and datasource defined with url, should return false", () => {
    const result: boolean = apiPluginHasUrl(
      "env1",
      PluginType.API,
      datasourceWithUrl,
    );

    expect(result).toBe(false);
  });

  it("2. If plugin type is different, should return false", () => {
    const result: boolean = apiPluginHasUrl(
      "env1",
      PluginType.SAAS,
      datasourceWithUrl,
    );

    expect(result).toBe(false);
  });

  // Negative cases, error is there due to various reasons
  it("3. Plugin type is API but datasource not defined, should return true", () => {
    const result: boolean = apiPluginHasUrl("env1", PluginType.API, undefined);

    expect(result).toBe(true);
  });

  it("4. If current environment is different from datasource env, should return true", () => {
    const result: boolean = apiPluginHasUrl(
      "env2",
      PluginType.API,
      datasourceWithUrl,
    );

    expect(result).toBe(true);
  });

  it("5. Plugin type is API and datasource defined without url, should return false", () => {
    const result: boolean = apiPluginHasUrl(
      "env1",
      PluginType.API,
      datasourceWithoutUrl,
    );

    expect(result).toBe(true);
  });
});
