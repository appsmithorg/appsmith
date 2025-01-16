import * as Factory from "factory.ts";
import { PluginPackageName } from "entities/Plugin";
import { PluginIDs } from "test/factories/MockPluginsState";
import { DatasourceConnectionMode, type Datasource } from "entities/Datasource";
import { SSLType } from "entities/Datasource/RestAPIForm";

interface DatasourceFactory extends Datasource {
  pluginPackageName?: PluginPackageName;
}

export const datasourceFactory = (pluginPackageName?: PluginPackageName) =>
  Factory.Sync.makeFactory<DatasourceFactory>({
    id: "ds-id",
    userPermissions: [
      "create:datasourceActions",
      "execute:datasources",
      "delete:datasources",
      "manage:datasources",
      "read:datasources",
    ],
    name: "Mock_DB",
    pluginId: PluginIDs[pluginPackageName || PluginPackageName.POSTGRES],
    workspaceId: "workspace-id",
    datasourceStorages: {
      "65fc11feb48e3e52a6d91d34": {
        datasourceId: "65fc124fb48e3e52a6d91d44",
        environmentId: "65fc11feb48e3e52a6d91d34",
        datasourceConfiguration: {
          url: "mockdb.internal.appsmith.com",
          connection: {
            mode: DatasourceConnectionMode.READ_ONLY,
            ssl: {
              authType: SSLType.DEFAULT,
              authTypeControl: false,
              certificateFile: {
                name: "",
                base64Content: null,
              },
            },
          },
          authentication: {
            authenticationType: "dbAuth",
            username: "mockdb",
          },
        },
        isConfigured: true,
        isValid: true,
      },
    },
    invalids: [],
    messages: [],
  });
