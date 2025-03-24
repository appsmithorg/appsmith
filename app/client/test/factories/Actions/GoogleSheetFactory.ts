import * as Factory from "factory.ts";
import type { SaaSAction } from "entities/Action";
import { PluginPackageName, PluginType } from "entities/Plugin";
import { PluginIDs } from "test/factories/MockPluginsState";

const pageId = "0123456789abcdef00000000";

export const GoogleSheetFactory = Factory.Sync.makeFactory<SaaSAction>({
  dynamicBindingPathList: [],
  isDirtyMap: {
    SCHEMA_GENERATION: false,
  },
  id: "api_id",
  baseId: "api_base_id",
  workspaceId: "workspaceID",
  applicationId: "applicationID",
  pluginType: PluginType.SAAS,
  pluginId: PluginIDs[PluginPackageName.GOOGLE_SHEETS],
  name: Factory.each((i) => `Api${i + 1}`),
  datasource: {
    id: "GoogleSheetsDatasourceID",
    name: "SheetsExampleDatabase",
    pluginId: PluginIDs[PluginPackageName.GOOGLE_SHEETS],
  },
  pageId: pageId,
  actionConfiguration: {
    timeoutInMillisecond: 10000,
    paginationType: "NONE",
    encodeParamsToggle: true,
    selfReferencingDataPaths: [],
    formData: {
      command: {
        data: "FETCH_MANY",
      },
      entityType: {
        data: "ROWS",
      },
      tableHeaderIndex: {
        data: "1",
      },
      projection: {
        data: [],
      },
      queryFormat: {
        data: "ROWS",
      },
      range: {
        data: "",
      },
      where: {
        data: {
          condition: "AND",
        },
      },
      pagination: {
        data: {
          limit: "20",
          offset: "0",
        },
      },
      smartSubstitution: {
        data: true,
      },
    },
  },
  executeOnLoad: false,
  isValid: true,
  invalids: [],
  messages: [],
  jsonPathKeys: [],
  confirmBeforeExecute: false,
  userPermissions: [
    "read:actions",
    "delete:actions",
    "execute:actions",
    "manage:actions",
  ],
  eventData: {},
  cacheResponse: "",
});
