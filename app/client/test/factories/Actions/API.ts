import * as Factory from "factory.ts";
import { PaginationType, type ApiAction } from "entities/Action";
import { PluginPackageName, PluginType } from "entities/Plugin";
import { PluginIDs } from "test/factories/MockPluginsState";

const pageId = "0123456789abcdef00000000";

export const APIFactory = Factory.Sync.makeFactory<ApiAction>({
  name: Factory.each((i) => `Api${i + 1}`),
  id: "api_id",
  baseId: "api_base_id",
  pageId: pageId,
  pluginId: PluginIDs[PluginPackageName.REST_API],
  pluginType: PluginType.API,
  workspaceId: "workspaceId",
  applicationId: "applicationId",
  actionConfiguration: {
    timeoutInMillisecond: 10000,
    paginationType: PaginationType.NONE,
    headers: [
      {
        key: "",
        value: "",
      },
      {
        key: "",
        value: "",
      },
    ],
    encodeParamsToggle: true,
    queryParameters: [
      {
        key: "",
        value: "",
      },
      {
        key: "",
        value: "",
      },
    ],
    body: "",
    bodyFormData: [],
    httpMethod: "GET",
    httpVersion: "HTTP11",
    pluginSpecifiedTemplates: [
      {
        value: true,
      },
    ],
    formData: {
      apiContentType: "none",
    },
  },
  cacheResponse: "",
  datasource: {
    userPermissions: [],
    name: "DEFAULT_REST_DATASOURCE",
    pluginId: PluginIDs[PluginPackageName.REST_API],
    workspaceId: "workspaceId",
    invalids: [],
    messages: [],
    isValid: true,
    datasourceConfiguration: { url: "www.mock-api.appsmith.com" },
  },
  dynamicBindingPathList: [],
  runBehaviour: "MANUAL",
  invalids: [],
  isValid: true,
  jsonPathKeys: [],
  messages: [],
  userPermissions: [
    "read:actions",
    "delete:actions",
    "execute:actions",
    "manage:actions",
  ],
  confirmBeforeExecute: false,
  isDirtyMap: {
    SCHEMA_GENERATION: false,
  },
});
