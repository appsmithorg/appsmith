import { PluginType } from "entities/Action";
import { generateDataTreeJSAction } from "entities/DataTree/dataTreeJSAction";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";

describe("generateDataTreeJSAction", () => {
  it("generate js collection in data tree", () => {
    const jsCollection: JSCollectionData = {
      isLoading: false,
      config: {
        id: "1234",
        applicationId: "app123",
        workspaceId: "workspace123",
        name: "JSObject2",
        pageId: "page123",
        pluginId: "plugin123",
        pluginType: PluginType.JS,
        actionIds: [],
        archivedActionIds: [],
        actions: [
          {
            id: "abcd",
            applicationId: "app123",
            workspaceId: "workspace123",
            pluginType: PluginType.JS,
            pluginId: "plugin123",
            name: "myFun2",
            fullyQualifiedName: "JSObject2.myFun2",
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
              body: "async () => {\n\t\t//use async-await or promises\n\t}",
              jsArguments: [],
              isAsync: true,
            },
            executeOnLoad: false,
            dynamicBindingPathList: [
              {
                key: "body",
              },
            ],
            isValid: true,
            invalids: [],
            messages: [],
            jsonPathKeys: [
              "async () => {\n\t\t//use async-await or promises\n\t}",
            ],
            confirmBeforeExecute: false,
            userPermissions: [
              "read:actions",
              "execute:actions",
              "manage:actions",
            ],
            validName: "JSObject2.myFun2",
          },
          {
            id: "623973054d9aea1b062af87b",
            applicationId: "app123",
            workspaceId: "workspace123",
            pluginType: "JS",
            pluginId: "plugin123",
            name: "myFun1",
            fullyQualifiedName: "JSObject2.myFun1",
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
            userPermissions: [
              "read:actions",
              "execute:actions",
              "manage:actions",
            ],
            validName: "JSObject2.myFun1",
          },
        ],
        archivedActions: [],
        body:
          "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t}\n}",
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
        abcd: {
          users: [{ id: 1, name: "John" }],
        },
      },
    };
    const expected = {
      myVar1: [],
      myVar2: {},
      name: "JSObject2",
      actionId: "1234",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
      body:
        "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t}\n}",
      meta: {
        myFun2: {
          arguments: [],
          isAsync: true,
          confirmBeforeExecute: false,
        },
        myFun1: {
          arguments: [],
          isAsync: false,
          confirmBeforeExecute: false,
        },
      },
      bindingPaths: {
        body: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "myVar1",
        },
        {
          key: "myVar2",
        },
        {
          key: "myFun2",
        },
        {
          key: "myFun1",
        },
      ],
      variables: ["myVar1", "myVar2"],
      dependencyMap: {
        body: ["myFun2", "myFun1"],
      },
      myFun2: {
        data: {
          users: [{ id: 1, name: "John" }],
        },
      },
      myFun1: {
        data: {},
      },
      reactivePaths: {
        body: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
      },
    };
    const result = generateDataTreeJSAction(jsCollection);
    expect(result).toStrictEqual(expected);
  });
  it("replaces 'this' in body with js object name", () => {
    const jsCollection: JSCollectionData = {
      isLoading: false,
      config: {
        id: "1234",
        applicationId: "app123",
        workspaceId: "workspace123",
        name: "JSObject2",
        pageId: "page123",
        pluginId: "plugin123",
        pluginType: PluginType.JS,
        actionIds: [],
        archivedActionIds: [],
        actions: [
          {
            id: "abcd",
            applicationId: "app123",
            workspaceId: "workspace123",
            pluginType: PluginType.JS,
            pluginId: "plugin123",
            name: "myFun2",
            fullyQualifiedName: "JSObject2.myFun2",
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
              body: "async () => {\n\t\t//use async-await or promises\n\t}",
              jsArguments: [],
              isAsync: true,
            },
            executeOnLoad: false,
            dynamicBindingPathList: [
              {
                key: "body",
              },
            ],
            isValid: true,
            invalids: [],
            messages: [],
            jsonPathKeys: [
              "async () => {\n\t\t//use async-await or promises\n\t}",
            ],
            confirmBeforeExecute: false,
            userPermissions: [
              "read:actions",
              "execute:actions",
              "manage:actions",
            ],
            validName: "JSObject2.myFun2",
          },
          {
            id: "623973054d9aea1b062af87b",
            applicationId: "app123",
            workspaceId: "workspace123",
            pluginType: "JS",
            pluginId: "plugin123",
            name: "myFun1",
            fullyQualifiedName: "JSObject2.myFun1",
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
            userPermissions: [
              "read:actions",
              "execute:actions",
              "manage:actions",
            ],
            validName: "JSObject2.myFun1",
          },
        ],
        archivedActions: [],
        body:
          "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t return this.myFun2},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t}\n}",
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
        abcd: {
          users: [{ id: 1, name: "John" }],
        },
      },
    };

    const expected = {
      myVar1: [],
      myVar2: {},
      name: "JSObject2",
      actionId: "1234",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
      body:
        "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1: () => {\n\t\t//write code here\n\t return JSObject2.myFun2},\n\tmyFun2: async () => {\n\t\t//use async-await or promises\n\t}\n}",
      meta: {
        myFun2: {
          arguments: [],
          isAsync: true,
          confirmBeforeExecute: false,
        },
        myFun1: {
          arguments: [],
          isAsync: false,
          confirmBeforeExecute: false,
        },
      },
      bindingPaths: {
        body: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "myVar1",
        },
        {
          key: "myVar2",
        },
        {
          key: "myFun2",
        },
        {
          key: "myFun1",
        },
      ],
      variables: ["myVar1", "myVar2"],
      dependencyMap: {
        body: ["myFun2", "myFun1"],
      },
      myFun2: {
        data: {
          users: [{ id: 1, name: "John" }],
        },
      },
      myFun1: {
        data: {},
      },
      reactivePaths: {
        body: "SMART_SUBSTITUTE",
        myFun1: "SMART_SUBSTITUTE",
        myFun2: "SMART_SUBSTITUTE",
        myVar1: "SMART_SUBSTITUTE",
        myVar2: "SMART_SUBSTITUTE",
      },
    };

    const result = generateDataTreeJSAction(jsCollection);
    expect(result).toStrictEqual(expected);
  });
});
