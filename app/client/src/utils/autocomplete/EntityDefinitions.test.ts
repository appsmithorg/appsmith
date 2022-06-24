import { PluginType } from "entities/Action";
import { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import {
  entityDefinitions,
  getPropsForJSActionEntity,
} from "utils/autocomplete/EntityDefinitions";

describe("EntityDefinitions", () => {
  it("it tests list widget selectRow", () => {
    const listWidgetProps = {
      widgetId: "yolo",
      widgetName: "List1",
      parentId: "123",
      renderMode: "CANVAS",
      text: "yo",
      type: "INPUT_WIDGET_V2",
      parentColumnSpace: 1,
      parentRowSpace: 2,
      leftColumn: 2,
      rightColumn: 3,
      topRow: 1,
      bottomRow: 2,
      isLoading: false,
      version: 1,
      selectedItem: {
        id: 1,
        name: "Some random name",
      },
    };

    const listWidgetEntityDefinitions = entityDefinitions.LIST_WIDGET(
      listWidgetProps,
    );

    const output = {
      "!doc":
        "Containers are used to group widgets together to form logical higher order widgets. Containers let you organize your page better and move all the widgets inside them together.",
      "!url": "https://docs.appsmith.com/widget-reference/list",
      backgroundColor: {
        "!type": "string",
        "!url": "https://docs.appsmith.com/widget-reference/how-to-use-widgets",
      },
      isVisible: {
        "!type": "bool",
        "!doc": "Boolean value indicating if the widget is in visible state",
      },
      selectedItem: { id: "number", name: "string" },
      gridGap: "number",
      items: "?",
      listData: "?",
      pageNo: "?",
      pageSize: "?",
    };

    expect(listWidgetEntityDefinitions).toStrictEqual(output);
  });
});

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
    fun1: {},
    fun2: [],
  },
  isExecuting: {},
};

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
    const result = getPropsForJSActionEntity(jsObject);
    expect(expectedProperties).toStrictEqual(result);
  });
});
