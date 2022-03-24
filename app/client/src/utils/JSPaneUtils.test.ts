import { PluginType } from "entities/Action";
import { JSCollection } from "entities/JSCollection";
import { getDifferenceInJSCollection, ParsedBody } from "./JSPaneUtils";

const JSObject1: JSCollection = {
  id: "1234",
  applicationId: "app123",
  organizationId: "org123",
  name: "JSObject2",
  pageId: "page123",
  pluginId: "plugin123",
  pluginType: PluginType.JS,
  actionIds: [],
  archivedActionIds: [],
  actions: [
    {
      id: "fun2",
      applicationId: "app123",
      organizationId: "org123",
      pluginType: "JS",
      pluginId: "plugin123",
      name: "myFun2",
      fullyQualifiedName: "JSObject2.myFun2",
      datasource: {
        userPermissions: [],
        name: "UNUSED_DATASOURCE",
        pluginId: "plugin123",
        organizationId: "org123",
        messages: [],
        isValid: true,
        new: true,
      },
      pageId: "page123",
      collectionId: "1234",
      actionConfiguration: {
        timeoutInMillisecond: 10000,
        paginationType: "NONE",
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
      validName: "JSObject2.myFun2",
    },
    {
      id: "fun1",
      applicationId: "app123",
      organizationId: "org123",
      pluginType: "JS",
      pluginId: "plugin123",
      name: "myFun1",
      fullyQualifiedName: "JSObject2.myFun1",
      datasource: {
        userPermissions: [],
        name: "UNUSED_DATASOURCE",
        pluginId: "plugin123",
        organizationId: "org123",
        messages: [],
        isValid: true,
        new: true,
      },
      pageId: "page123",
      collectionId: "1234",
      actionConfiguration: {
        timeoutInMillisecond: 10000,
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
};

const JSObject2: JSCollection = {
  id: "1234",
  applicationId: "app123",
  organizationId: "org123",
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
      organizationId: "org123",
      pluginType: "JS",
      pluginId: "plugin123",
      name: "myFun1",
      fullyQualifiedName: "JSObject3.myFun1",
      datasource: {
        userPermissions: [],
        name: "UNUSED_DATASOURCE",
        pluginId: "plugin123",
        organizationId: "org123",
        messages: [],
        isValid: true,
        new: true,
      },
      pageId: "page123",
      collectionId: "1234",
      actionConfiguration: {
        timeoutInMillisecond: 10000,
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
      organizationId: "org123",
      pluginType: "JS",
      pluginId: "plugin123",
      name: "myFun2",
      fullyQualifiedName: "JSObject3.myFun2",
      datasource: {
        userPermissions: [],
        name: "UNUSED_DATASOURCE",
        pluginId: "plugin123",
        organizationId: "org123",
        messages: [],
        isValid: true,
        new: true,
      },
      pageId: "page123",
      collectionId: "1234",
      actionConfiguration: {
        timeoutInMillisecond: 10000,
        paginationType: "NONE",
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
};

const parsedBodyWithRenamedAction: ParsedBody = {
  actions: [
    {
      name: "myFun11",
      body: "() => {\n\t\t//write code here\n\t}",
      arguments: [],
      isAsync: false,
    },
    {
      name: "myFun2",
      body: "async () => {\n\t\t//use async-await or promises\n\t}",
      arguments: [],
      isAsync: true,
    },
  ],
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
};

const resultRenamedActions = {
  newActions: [],
  updateActions: [
    {
      id: "fun1",
      applicationId: "app123",
      organizationId: "org123",
      pluginType: "JS",
      pluginId: "plugin123",
      name: "myFun11",
      fullyQualifiedName: "JSObject2.myFun1",
      datasource: {
        userPermissions: [],
        name: "UNUSED_DATASOURCE",
        pluginId: "plugin123",
        organizationId: "org123",
        messages: [],
        isValid: true,
        new: true,
      },
      pageId: "page123",
      collectionId: "1234",
      actionConfiguration: {
        timeoutInMillisecond: 10000,
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
      validName: "JSObject2.myFun1",
    },
  ],
  deletedActions: [],
  nameChangedActions: [
    {
      id: "fun1",
      collectionId: "1234",
      oldName: "myFun1",
      newName: "myFun11",
      pageId: "page123",
    },
  ],
  changedVariables: [],
};

const parsedBodyWithDeletedAction: ParsedBody = {
  actions: [
    {
      name: "myFun1",
      body: "() => {\n\t\t//write code here\n\t}",
      arguments: [],
      isAsync: false,
    },
  ],
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
};

const resultDeletedActions = {
  newActions: [],
  updateActions: [],
  deletedActions: [
    {
      id: "fun2",
      applicationId: "app123",
      organizationId: "org123",
      pluginType: "JS",
      pluginId: "plugin123",
      name: "myFun2",
      fullyQualifiedName: "JSObject2.myFun2",
      datasource: {
        userPermissions: [],
        name: "UNUSED_DATASOURCE",
        pluginId: "plugin123",
        organizationId: "org123",
        messages: [],
        isValid: true,
        new: true,
      },
      pageId: "page123",
      collectionId: "1234",
      actionConfiguration: {
        timeoutInMillisecond: 10000,
        paginationType: "NONE",
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
      validName: "JSObject2.myFun2",
    },
  ],
  nameChangedActions: [],
  changedVariables: [],
};

const parsedBodyWithChangedVariable: ParsedBody = {
  actions: [
    {
      name: "myFun1",
      body: "() => {\n\t\t//write code here\n\t}",
      arguments: [],
      isAsync: false,
    },
    {
      name: "myFun2",
      body: "async () => {\n\t\t//use async-await or promises\n\t}",
      arguments: [],
      isAsync: true,
    },
  ],
  variables: [
    {
      name: "myVar1",
      value: "app",
    },
    {
      name: "myVar2",
      value: {},
    },
  ],
};
const resultChangedVariable = {
  newActions: [],
  updateActions: [],
  deletedActions: [],
  nameChangedActions: [],
  changedVariables: [
    {
      name: "myVar1",
      value: "app",
    },
  ],
};

describe("get difference in updated and new js collection", () => {
  it("get name changed js action", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithRenamedAction,
      JSObject1,
    );
    expect(resultRenamedActions).toStrictEqual(result);
  });

  it("get deleted js action", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithDeletedAction,
      JSObject1,
    );
    expect(resultDeletedActions).toStrictEqual(result);
  });
});

describe("get difference for variables", () => {
  it("get changed variable value in difference", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithChangedVariable,
      JSObject2,
    );
    expect(resultChangedVariable).toStrictEqual(result);
  });
});
