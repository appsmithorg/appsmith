import * as Factory from "factory.ts";
import { PaginationType, type QueryAction } from "entities/Action";
import { PluginPackageName, PluginType } from "entities/Plugin";
import { PluginIDs } from "test/factories/MockPluginsState";

const pageId = "0123456789abcdef00000000";

export const PostgresFactory = Factory.Sync.makeFactory<QueryAction>({
  cacheResponse: "",
  id: "query_id",
  baseId: "query_base_id",
  workspaceId: "workspaceId",
  applicationId: "applicationId",
  pluginType: PluginType.DB,
  pluginId: PluginIDs[PluginPackageName.POSTGRES],
  name: Factory.each((i) => `Query${i + 1}`),
  datasource: {
    id: "PostgresDatasourceID",
    name: "ExampleDatabase",
    pluginId: PluginIDs[PluginPackageName.POSTGRES],
  },
  pageId: pageId,
  actionConfiguration: {
    timeoutInMillisecond: 10000,
    paginationType: PaginationType.NONE,
    body: "select * from public.users limit 10",
    pluginSpecifiedTemplates: [
      {
        key: "preparedStatement",
        value: false,
      },
    ],
  },
  executeOnLoad: true,
  dynamicBindingPathList: [],
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
  isDirtyMap: {
    SCHEMA_GENERATION: false,
  },
});
