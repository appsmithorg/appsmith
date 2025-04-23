import * as Factory from "factory.ts";
import type { JSCollection } from "entities/JSCollection";
import { PluginPackageName, PluginType } from "entities/Plugin";
import { PluginIDs } from "test/factories/MockPluginsState";

const pageId = "0123456789abcdef00000000";

export const JSObjectFactory = Factory.Sync.makeFactory<JSCollection>({
  id: "js_id",
  baseId: "js_base_id",
  workspaceId: "workspaceId",
  applicationId: "appId",
  name: Factory.each((i) => `JSObject${i + 1}`),
  pageId: pageId,
  pluginId: PluginIDs[PluginPackageName.JS],
  pluginType: PluginType.JS,
  actions: [
    {
      id: "myFunc1_id",
      baseId: "myFunc1_base_id",
      workspaceId: "workspaceId",
      applicationId: "applicationId",
      pluginId: PluginIDs[PluginPackageName.JS],
      name: "myFun1",
      fullyQualifiedName: "JSObject1.myFun1",
      pageId: pageId,
      collectionId: "js_id",
      actionConfiguration: {
        timeoutInMillisecond: 10000,
        body: "function (){\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t}",
        jsArguments: [],
      },
      runBehavior: "MANUAL",
      clientSideExecution: true,
      dynamicBindingPathList: [
        {
          key: "body",
        },
      ],
      isValid: true,
      invalids: [],
      messages: [],
      jsonPathKeys: [
        "function (){\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t}",
      ],
      confirmBeforeExecute: false,
      userPermissions: [
        "read:actions",
        "delete:actions",
        "execute:actions",
        "manage:actions",
      ],
      cacheResponse: "",
      isDirtyMap: {
        SCHEMA_GENERATION: false,
      },
    },
    {
      id: "myFunc2_id",
      baseId: "myFunc2_base_id",
      workspaceId: "workspaceId",
      applicationId: "applicationId",
      pluginId: "613a26d921750e4b557a9241",
      name: "myFun2",
      fullyQualifiedName: "JSObject1.myFun2",
      pageId: pageId,
      collectionId: "660261174b59877d57fc3670",
      actionConfiguration: {
        timeoutInMillisecond: 10000,
        body: "async function () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}",
        jsArguments: [],
      },
      runBehavior: "MANUAL",
      clientSideExecution: true,
      dynamicBindingPathList: [
        {
          key: "body",
        },
      ],
      isValid: true,
      invalids: [],
      messages: [],
      jsonPathKeys: [
        "async function () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}",
      ],
      confirmBeforeExecute: false,
      userPermissions: [
        "read:actions",
        "delete:actions",
        "execute:actions",
        "manage:actions",
      ],
      cacheResponse: "",
      isDirtyMap: {
        SCHEMA_GENERATION: false,
      },
    },
  ],
  body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}",
  variables: [
    {
      name: "myVar1",
      value: [],
    },
    {
      name: "myVar2",
      value: {},
    },
  ],
  userPermissions: [
    "read:actions",
    "delete:actions",
    "execute:actions",
    "manage:actions",
  ],
});
