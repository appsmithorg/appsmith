import * as Factory from "factory.ts";
import type { ApiAction } from "../../../src/entities/Action";
import { PaginationType, PluginType } from "../../../src/entities/Action";

export const APIFactory = Factory.Sync.makeFactory<ApiAction>({
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
    pluginId: "ApiPluginID",
    workspaceId: "workspaceId",
    invalids: [],
    messages: [],
    isValid: true,
    datasourceConfiguration: { url: "www.mock-api.appsmith.com" },
  },
  dynamicBindingPathList: [],
  executeOnLoad: false,
  id: "api_id",
  invalids: [],
  isValid: true,
  jsonPathKeys: [],
  messages: [],
  name: Factory.each((i) => `Api${i + 1}`),
  pageId: "page_id",
  pluginId: "ApiPluginID",
  pluginType: PluginType.API,
  workspaceId: "workspaceId",
  userPermissions: [
    "read:actions",
    "delete:actions",
    "execute:actions",
    "manage:actions",
  ],
  confirmBeforeExecute: false,
});
