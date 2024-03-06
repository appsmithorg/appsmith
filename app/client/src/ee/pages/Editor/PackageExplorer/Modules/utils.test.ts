import type {
  Module,
  ModuleMetadata,
} from "@appsmith/constants/ModuleConstants";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import { PluginType } from "entities/Action";
import { groupModules } from "./utils";

describe("groupModules", () => {
  it("returns modulesMap and modulesCount", () => {
    // Mock the module data
    const modules = {
      "1": {
        id: "1",
        name: "JS Module B",
        type: MODULE_TYPE.JS,
      },
      "2": {
        id: "2",
        name: "JS Module A",
        type: MODULE_TYPE.JS,
      },
      "3": {
        id: "3",
        name: "Query Module Z",
        type: MODULE_TYPE.QUERY,
      },
      "4": {
        id: "4",
        name: "Query Module B",
        type: MODULE_TYPE.QUERY,
      },
      "5": {
        id: "5",
        name: "Query Module A",
        type: MODULE_TYPE.QUERY,
      },
      "6": {
        id: "6",
        name: "Query Module Y",
        type: MODULE_TYPE.QUERY,
      },
      "7": {
        id: "7",
        name: "Query Module X",
        type: MODULE_TYPE.QUERY,
      },
      "8": {
        id: "8",
        name: "Query Module N",
        type: MODULE_TYPE.QUERY,
      },
    } as unknown as Record<string, Module>;

    const modulesMetadata = {
      "1": {
        moduleId: "1",
        pluginId: "js-plugin",
        pluginType: PluginType.JS,
      },
      "2": {
        moduleId: "2",
        pluginId: "js-plugin",
        pluginType: PluginType.JS,
      },
      "3": {
        moduleId: "3",
        pluginId: "pg-plugin",
        datasourceId: "users-db",
        pluginType: PluginType.DB,
      },
      "4": {
        moduleId: "4",
        pluginId: "pg-plugin",
        datasourceId: "users-db",
        pluginType: PluginType.DB,
      },
      "5": {
        moduleId: "5",
        pluginId: "mongo-plugin",
        datasourceId: "status-db",
        pluginType: PluginType.DB,
      },
      "6": {
        moduleId: "6",
        pluginId: "mongo-plugin",
        datasourceId: "status-db",
        pluginType: PluginType.DB,
      },
      "7": {
        moduleId: "7",
        pluginId: "pg-plugin",
        datasourceId: "orders-db",
        pluginType: PluginType.DB,
      },
      "8": {
        moduleId: "8",
        pluginId: "api-plugin",
        pluginType: PluginType.API,
      },
      // Add more mock metadata as needed
    } as unknown as Record<string, ModuleMetadata>;

    // Render the hook
    const result = groupModules({ modules, modulesMetadata });

    // Assert the expected result
    expect(result.modulesMap).toEqual({
      [MODULE_TYPE.UI]: [],
      [MODULE_TYPE.JS]: [
        {
          id: "2",
          name: "JS Module A",
          type: MODULE_TYPE.JS,
          moduleId: "2",
          pluginId: "js-plugin",
          pluginType: PluginType.JS,
        },
        {
          id: "1",
          name: "JS Module B",
          type: MODULE_TYPE.JS,
          moduleId: "1",
          pluginId: "js-plugin",
          pluginType: PluginType.JS,
        },
      ],
      [MODULE_TYPE.QUERY]: [
        {
          id: "5",
          name: "Query Module A",
          type: MODULE_TYPE.QUERY,
          moduleId: "5",
          pluginId: "mongo-plugin",
          datasourceId: "status-db",
          pluginType: PluginType.DB,
        },
        {
          id: "6",
          name: "Query Module Y",
          type: MODULE_TYPE.QUERY,
          moduleId: "6",
          pluginId: "mongo-plugin",
          datasourceId: "status-db",
          pluginType: PluginType.DB,
        },
        {
          id: "4",
          name: "Query Module B",
          type: MODULE_TYPE.QUERY,
          moduleId: "4",
          pluginId: "pg-plugin",
          datasourceId: "users-db",
          pluginType: PluginType.DB,
        },
        {
          id: "3",
          name: "Query Module Z",
          type: MODULE_TYPE.QUERY,
          moduleId: "3",
          pluginId: "pg-plugin",
          datasourceId: "users-db",
          pluginType: PluginType.DB,
        },
        {
          id: "7",
          moduleId: "7",
          name: "Query Module X",
          pluginId: "pg-plugin",
          datasourceId: "orders-db",
          pluginType: PluginType.DB,
          type: MODULE_TYPE.QUERY,
        },
        {
          id: "8",
          name: "Query Module N",
          type: MODULE_TYPE.QUERY,
          moduleId: "8",
          pluginId: "api-plugin",
          pluginType: PluginType.API,
        },
      ],
    });
  });
});
