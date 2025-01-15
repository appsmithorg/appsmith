import { getDefaultEnvId } from "ee/api/ApiUtils";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { PluginPackageName } from "entities/Plugin";

export const mockPlugins = [
  {
    id: "623a809913b3311bd5e77228",
    userPermissions: [],
    name: "PostgreSQL",
    type: "DB",
    packageName: PluginPackageName.POSTGRES,
    iconLocation: getAssetUrl(`${ASSETS_CDN_URL}/logo/postgresql.svg`),
    documentationLink:
      "https://docs.appsmith.com/connect-data/reference/querying-postgres#query-postgresql",
    responseType: "TABLE",
    uiComponent: "DbEditorForm",
    datasourceComponent: "AutoForm",
    generateCRUDPageComponent: "PostgreSQL",
    defaultInstall: true,
    allowUserDatasources: true,
    remotePlugin: false,
    new: false,
  },
  {
    id: "623a809913b3311bd5e77229",
    userPermissions: [],
    name: "REST API",
    type: "API",
    packageName: PluginPackageName.REST_API,
    iconLocation: getAssetUrl(`${ASSETS_CDN_URL}/RestAPI.png`),
    uiComponent: "ApiEditorForm",
    datasourceComponent: "RestAPIDatasourceForm",
    defaultInstall: true,
    allowUserDatasources: true,
    templates: {},
    remotePlugin: false,
    new: false,
  },
];

const defaultEnvId = getDefaultEnvId();

export const mockDatasources = [
  {
    id: "623ab2519b867130d3ed1c27",
    userPermissions: [
      "execute:datasources",
      "manage:datasources",
      "read:datasources",
    ],
    gitSyncId: "623a80d613b3311bd5e77308_623ab2519b867130d3ed1c26",
    name: "Mock Database",
    pluginId: "623a809913b3311bd5e77228",
    workspaceId: "623a80d613b3311bd5e77308",
    datasourceStorages: {
      [defaultEnvId]: {
        datasourceConfiguration: {
          connection: { mode: "READ_WRITE", ssl: { authType: "DEFAULT" } },
          endpoints: [
            {
              host: "fake-api.cvuydmurdlas.us-east-1.rds.amazonaws.com",
              port: 5432,
            },
          ],
          sshProxyEnabled: false,
        },
      },
    },
    invalids: [],
    messages: [],
    isConfigured: true,
    isValid: true,
    new: false,
  },
  {
    id: "623abc8b9b867130d3ed1c43",
    userPermissions: [
      "execute:datasources",
      "manage:datasources",
      "read:datasources",
    ],
    gitSyncId: "623a80d613b3311bd5e77308_623abc8b9b867130d3ed1c42",
    name: "Test",
    pluginId: "623a809913b3311bd5e77229",
    workspaceId: "623a80d613b3311bd5e77308",
    datasourceStorages: {
      [defaultEnvId]: {
        datasourceConfiguration: {
          connection: { ssl: { authType: "DEFAULT" } },
          sshProxyEnabled: false,
          properties: [
            { key: "isSendSessionEnabled", value: "N" },
            { key: "sessionSignatureKey", value: "" },
          ],
          url: "Test",
          headers: [],
          queryParameters: [],
        },
      },
    },
    invalids: [],
    messages: [],
    isConfigured: true,
    isValid: true,
    new: false,
  },
];
