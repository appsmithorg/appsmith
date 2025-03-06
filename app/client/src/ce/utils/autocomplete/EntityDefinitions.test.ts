import { PluginType } from "entities/Plugin";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";
import { getPropsForJSActionEntity } from "ee/pages/Editor/Explorer/Entity/getEntityProperties";
import type { JSActionEntity } from "ee/entities/DataTree/types";

const jsObject: JSCollectionData = {
  isLoading: false,
  config: {
    id: "1234",
    applicationId: "app123",
    workspaceId: "workspace123",
    name: "JSObject3",
    pageId: "page123",
    pluginId: "plugin123",
    pluginType: PluginType.JS,
    actionIds: [],
    archivedActionIds: [],
    actions: [
      {
        id: "fun1",
        applicationId: "app123",
        workspaceId: "workspace123",
        pluginType: "JS",
        pluginId: "plugin123",
        name: "myFun1",
        fullyQualifiedName: "JSObject3.myFun1",
        datasource: {
          userPermissions: [],
          name: "UNUSED_DATASOURCE",
          pluginId: "plugin123",
          workspaceId: "workspace123",
          messages: [],
          isValid: true,
          new: true,
        },
        pageId: "page123",
        collectionId: "1234",
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          // @ts-expect-error: paginationType does not exists on JSAction
          paginationType: "NONE",
          encodeParamsToggle: true,
          body: "() => {\n\t\t//write code here\n\t}",
          jsArguments: [],
          isAsync: false,
        },
        executeOnLoad: false,
        clientSideExecution: true,
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        isValid: true,
        invalids: [],
        messages: [],
        jsonPathKeys: ["() => {\n\t\t//write code here\n\t}"],
        confirmBeforeExecute: false,
        userPermissions: ["read:actions", "execute:actions", "manage:actions"],
        validName: "JSObject3.myFun1",
      },
      {
        id: "fun2",
        applicationId: "app123",
        workspaceId: "workspace123",
        pluginType: PluginType.JS,
        pluginId: "plugin123",
        name: "myFun2",
        fullyQualifiedName: "JSObject3.myFun2",
        datasource: {
          userPermissions: [],
          name: "UNUSED_DATASOURCE",
          pluginId: "plugin123",
          workspaceId: "workspace123",
          messages: [],
          isValid: true,
          new: true,
        },
        pageId: "page123",
        collectionId: "1234",
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          // @ts-expect-error: encodeParamsToggle does not exists on JSAction
          encodeParamsToggle: true,
          body: "async () => {\n\t\t//use async-await or promises\n\t}",
          jsArguments: [],
          isAsync: true,
        },
        executeOnLoad: false,
        clientSideExecution: true,
        dynamicBindingPathList: [
          {
            key: "body",
          },
        ],
        isValid: true,
        invalids: [],
        messages: [],
        jsonPathKeys: ["async () => {\n\t\t//use async-await or promises\n\t}"],
        confirmBeforeExecute: false,
        userPermissions: ["read:actions", "execute:actions", "manage:actions"],
        validName: "JSObject3.myFun2",
      },
    ],
    archivedActions: [],
    body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t}\n}",
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
  },
  data: {
    fun1: {},
    fun2: [],
  },
  isExecuting: {},
};

jest.mock("store", () => {
  return {
    getState: () => ({
      entities: {
        jsActions: [jsObject],
      },
    }),
  };
});

jest.mock("utils/configTree", () => {
  return {
    getConfigTree: () => ({
      JSObject3: {
        variables: ["myVar1", "myVar2"],
      },
    }),
  };
});

describe("getPropsForJSActionEntity", () => {
  it("get properties from js collection to show bindings", () => {
    const expectedProperties = {
      "myFun1()": "Function",
      "myFun2()": "Function",
      myVar1: [],
      myVar2: {},
      "myFun1.data": {},
      "myFun2.data": [],
    };

    const jsObjectEntity = {
      myVar1: [],
      myVar2: {},
      myFun2: "async function () {}",
      myFun1: 'function () {\n  return "hellonsljns";\n}',
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\t//\twrite code here\n\t\t//\tJSObject1.myVar1 = [1,2,3]\n\t\treturn \"hellonsljns\"\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}",
      ENTITY_TYPE: "JSACTION",
      actionId: "1234",
    };

    const result = getPropsForJSActionEntity(
      jsObjectEntity as JSActionEntity,
      "JSObject3",
    );

    expect(expectedProperties).toStrictEqual(result);
  });
});
