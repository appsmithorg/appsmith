import { PluginType } from "entities/Action";
import { JSCollection } from "entities/JSCollection";
import { getDifferenceInJSCollection, ParsedBody } from "./JSPaneUtils";

const JSObject1: JSCollection = {
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
      id: "fun2",
      applicationId: "app123",
      workspaceId: "workspace123",
      pluginType: "JS",
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
  workspaceId: "workspace123",
  name: "JSObject2",
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
      userPermissions: ["read:actions", "execute:actions", "manage:actions"],
      validName: "JSObject2.myFun1",
    },
    {
      id: "fun2",
      applicationId: "app123",
      workspaceId: "workspace123",
      pluginType: "JS",
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
      workspaceId: "workspace123",
      pluginType: "JS",
      pluginId: "plugin123",
      name: "myFun11",
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
      workspaceId: "workspace123",
      pluginType: "JS",
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

const parsedBodyWithChangeInBody: ParsedBody = {
  actions: [
    {
      name: "myFun1",
      body: "() => {\n\t\t//write code here\n\t}",
      arguments: [],
      isAsync: false,
    },
    {
      name: "myFun2",
      body:
        "async () => {\n\t\t//use async-await or promises\n\tconsole.log('content changed')}",
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

const resultChangedBody = {
  newActions: [],
  updateActions: [
    {
      id: "fun2",
      applicationId: "app123",
      workspaceId: "workspace123",
      pluginType: "JS",
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
        paginationType: "NONE",
        encodeParamsToggle: true,
        body:
          "async () => {\n\t\t//use async-await or promises\n\tconsole.log('content changed')}",
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
  deletedActions: [],
  nameChangedActions: [],
  changedVariables: [],
};
const parsedBodyWithChangedParameters: ParsedBody = {
  actions: [
    {
      name: "myFun1",
      body: "() => {\n\t\t//write code here\n\t}",
      arguments: [],
      isAsync: false,
    },
    {
      name: "myFun2",
      body: "async (a,b) => {\n\t\t//use async-await or promises\n\t}",
      arguments: [
        { name: "a", value: undefined },
        { name: "b", value: undefined },
      ],
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

const resultChangedParameters = {
  newActions: [],
  updateActions: [
    {
      id: "fun2",
      applicationId: "app123",
      workspaceId: "workspace123",
      pluginType: "JS",
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
        paginationType: "NONE",
        encodeParamsToggle: true,
        body: "async (a,b) => {\n\t\t//use async-await or promises\n\t}",
        jsArguments: [
          { name: "a", value: undefined },
          { name: "b", value: undefined },
        ],
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
  deletedActions: [],
  nameChangedActions: [],
  changedVariables: [],
};

const parsedBodyWithRemovedAsync: ParsedBody = {
  actions: [
    {
      name: "myFun1",
      body: "() => {\n\t\t//write code here\n\t}",
      arguments: [],
      isAsync: false,
    },
    {
      name: "myFun2",
      body: "() => {\n\t\t//use async-await or promises\n\t}",
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

const resultRemovedAsync = {
  newActions: [],
  updateActions: [
    {
      id: "fun2",
      applicationId: "app123",
      workspaceId: "workspace123",
      pluginType: "JS",
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
        paginationType: "NONE",
        encodeParamsToggle: true,
        body: "() => {\n\t\t//use async-await or promises\n\t}",
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
      jsonPathKeys: ["async () => {\n\t\t//use async-await or promises\n\t}"],
      confirmBeforeExecute: false,
      userPermissions: ["read:actions", "execute:actions", "manage:actions"],
      validName: "JSObject2.myFun2",
    },
  ],
  deletedActions: [],
  nameChangedActions: [],
  changedVariables: [],
};

const parsedBodyWithAddedAsync: ParsedBody = {
  actions: [
    {
      name: "myFun1",
      body: "async () => {\n\t\t//write code here\n\t}",
      arguments: [],
      isAsync: true,
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

const resultAddedAsync = {
  newActions: [],
  updateActions: [
    {
      id: "fun1",
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
        paginationType: "NONE",
        encodeParamsToggle: true,
        body: "async () => {\n\t\t//write code here\n\t}",
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
      jsonPathKeys: ["() => {\n\t\t//write code here\n\t}"],
      confirmBeforeExecute: false,
      userPermissions: ["read:actions", "execute:actions", "manage:actions"],
      validName: "JSObject2.myFun1",
    },
  ],
  deletedActions: [],
  nameChangedActions: [],
  changedVariables: [],
};

const parsedBodyWithAddedAction: ParsedBody = {
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
    {
      name: "myFun3",
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

const resultAddedAction = {
  newActions: [
    {
      name: "myFun3",
      executeOnLoad: false,
      pageId: "page123",
      collectionId: "1234",
      workspaceId: "workspace123",
      actionConfiguration: {
        body: "async () => {\n\t\t//use async-await or promises\n\t}",
        isAsync: true,
        timeoutInMillisecond: 0,
        jsArguments: [],
      },
    },
  ],
  updateActions: [],
  deletedActions: [],
  nameChangedActions: [],
  changedVariables: [],
};

describe("getDifferenceInJSCollection", () => {
  it("gets name changed js action", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithRenamedAction,
      JSObject1,
    );
    expect(resultRenamedActions).toStrictEqual(result);
  });

  it("gets deleted js action", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithDeletedAction,
      JSObject1,
    );
    expect(resultDeletedActions).toStrictEqual(result);
  });

  it("gets added js action ", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithAddedAction,
      JSObject2,
    );
    expect(resultAddedAction).toStrictEqual(result);
  });

  it("gets changed variable value in difference", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithChangedVariable,
      JSObject2,
    );
    expect(resultChangedVariable).toStrictEqual(result);
  });

  it("gets updated body value in difference", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithChangeInBody,
      JSObject2,
    );
    expect(resultChangedBody).toStrictEqual(result);
  });

  it("gets updated params value in difference", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithChangedParameters,
      JSObject2,
    );
    expect(resultChangedParameters).toStrictEqual(result);
  });
  it("gets removed async tag in difference", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithRemovedAsync,
      JSObject2,
    );
    expect(resultRemovedAsync).toStrictEqual(result);
  });

  it("gets added async tag value in difference", () => {
    const result = getDifferenceInJSCollection(
      parsedBodyWithAddedAsync,
      JSObject2,
    );
    expect(resultAddedAsync).toStrictEqual(result);
  });
});
