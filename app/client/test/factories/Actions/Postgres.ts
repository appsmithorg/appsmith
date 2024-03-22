import * as Factory from "factory.ts";
import type { QueryAction } from "entities/Action";
import { PaginationType, PluginPackageName, PluginType } from "entities/Action";
import { PluginIDs } from "test/factories/MockPluginsState";

export const PostgresFactory = Factory.Sync.makeFactory<QueryAction>({
  cacheResponse: "",
  id: "query_id",
  workspaceId: "workspaceId",
  pluginType: PluginType.DB,
  pluginId: PluginIDs[PluginPackageName.POSTGRES],
  name: Factory.each((i) => `Query${i + 1}`),
  datasource: {
    id: "PostgresDatasourceID",
    name: "ExampleDatabase",
    pluginId: PluginIDs[PluginPackageName.POSTGRES],
  },
  pageId: "page_id",
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
});
