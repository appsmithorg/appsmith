import { klona } from "klona";

import moduleInstanceEntitiesReducer, {
  initialState,
} from "./moduleInstanceEntitiesReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import type { JSCollection } from "entities/JSCollection";

const DEFAULT_ACTIONS = [
  {
    id: "65265ab24b7c8d700a10265e",
    name: "QueryModule1",
    moduleId: "652519c44b7c8d700a102643",
    actionConfiguration: {
      timeoutInMillisecond: 10000,
      paginationType: "NONE",
    },
    someSetting: false,
    executeOnLoad: false,
    isValid: true,
    validName: "Api4",
    entityReferenceType: "ACTION",
    executableConfiguration: {
      timeoutInMillisecond: 10000,
    },
    configurationPath: "Api4.actionConfiguration",
  },
  {
    id: "6526621d4b7c8d700a102663",
    name: "Query2",
    moduleId: "652519c44b7c8d700a102643",
    someSetting: true,
    actionConfiguration: {
      timeoutInMillisecond: 10000,
      paginationType: "NONE",
      encodeParamsToggle: true,
      selfReferencingDataPaths: [],
    },
    executeOnLoad: false,
    isValid: true,
  },
  {
    id: "6526621d4b7c8d450a102985",
    name: "QueryModule2",
    moduleId: "652519c44b7c8d700a102356",
    someSetting: false,
    actionConfiguration: {
      timeoutInMillisecond: 10000,
      paginationType: "NONE",
      encodeParamsToggle: true,
      selfReferencingDataPaths: [],
    },
    executeOnLoad: false,
    isValid: true,
  },
] as unknown as Action[];

const DEFAULT_JS_COLLECTIONS = [
  {
    id: "656ecb3b1a0d425da1cd3661",
    applicationId: "656dbfe11a0d425da1cd3644",
    workspaceId: "656db1f51a0d425da1cd360a",
    name: "JSObject1",
    pageId: "656dbfe11a0d425da1cd3647",
    pluginId: "6566e6924aa1dd03b3e42926",
    errorReports: [],
    pluginType: "JS",
    actionIds: [],
    archivedActionIds: [],
    actions: [
      {
        id: "656ecb3b1a0d425da1cd365d",
        applicationId: "656dbfe11a0d425da1cd3644",
        workspaceId: "656db1f51a0d425da1cd360a",
        pluginType: "JS",
        pluginId: "6566e6924aa1dd03b3e42926",
        name: "myFun1",
        fullyQualifiedName: "JSObject1.myFun1",
        datasource: {
          userPermissions: [],
          name: "UNUSED_DATASOURCE",
          pluginId: "6566e6924aa1dd03b3e42926",
          workspaceId: "656db1f51a0d425da1cd360a",
          datasourceStorages: {},
          messages: [],
          isValid: true,
          new: true,
        },
        pageId: "656dbfe11a0d425da1cd3647",
        collectionId: "656ecb3b1a0d425da1cd3661",
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          encodeParamsToggle: true,
          body: "function () {}",
          selfReferencingDataPaths: [],
          jsArguments: [],
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
        jsonPathKeys: ["function () {}"],
        confirmBeforeExecute: true,
        userPermissions: [
          "read:actions",
          "delete:actions",
          "execute:actions",
          "manage:actions",
        ],
        validName: "JSObject1.myFun1",
        entityReferenceType: "JSACTION",
        selfReferencingDataPaths: [],
      },
      {
        id: "656ecb3b1a0d425da1cd365c",
        applicationId: "656dbfe11a0d425da1cd3644",
        workspaceId: "656db1f51a0d425da1cd360a",
        pluginType: "JS",
        pluginId: "6566e6924aa1dd03b3e42926",
        name: "myFun2",
        fullyQualifiedName: "JSObject1.myFun2",
        datasource: {
          userPermissions: [],
          name: "UNUSED_DATASOURCE",
          pluginId: "6566e6924aa1dd03b3e42926",
          workspaceId: "656db1f51a0d425da1cd360a",
          datasourceStorages: {},
          messages: [],
          isValid: true,
          new: true,
        },
        pageId: "656dbfe11a0d425da1cd3647",
        collectionId: "656ecb3b1a0d425da1cd3661",
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          encodeParamsToggle: true,
          body: "async function () {}",
          selfReferencingDataPaths: [],
          jsArguments: [],
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
        jsonPathKeys: ["async function () {}"],
        confirmBeforeExecute: false,
        userPermissions: [
          "read:actions",
          "delete:actions",
          "execute:actions",
          "manage:actions",
        ],
        validName: "JSObject1.myFun2",
        entityReferenceType: "JSACTION",
        selfReferencingDataPaths: [],
      },
    ],
    archivedActions: [],
    body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}",
    variables: [
      {
        name: "myVar1",
        value: "[]",
      },
      {
        name: "myVar2",
        value: "{}",
      },
    ],
    userPermissions: [
      "read:actions",
      "delete:actions",
      "execute:actions",
      "manage:actions",
    ],
  },
] as unknown as JSCollection[];

const convertActionsToStateActions = (actions: Action[] | JSCollection[]) => {
  return actions.map((a) => ({
    isLoading: false,
    config: a,
  }));
};

describe("moduleInstanceEntitiesReducer", () => {
  it("should handle UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS when payload is action", () => {
    const currentState = {
      actions: convertActionsToStateActions(DEFAULT_ACTIONS),
      jsCollections: convertActionsToStateActions(DEFAULT_JS_COLLECTIONS),
    };

    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS,
      payload: {
        id: "6526621d4b7c8d450a102985",
        name: "QueryModule2",
        moduleId: "652519c44b7c8d700a102356",
        someSetting: true,
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          encodeParamsToggle: true,
          selfReferencingDataPaths: [],
        },
        executeOnLoad: false,
        isValid: true,
      } as unknown as Action,
    };

    const updatedActions = klona(DEFAULT_ACTIONS);
    updatedActions.pop();

    const expectedState = {
      actions: convertActionsToStateActions([
        ...updatedActions,
        action.payload,
      ]),
      jsCollections: currentState.jsCollections,
    };

    const nextState = moduleInstanceEntitiesReducer(currentState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS when payload is js collection", () => {
    const currentState = {
      actions: convertActionsToStateActions(DEFAULT_ACTIONS),
      jsCollections: convertActionsToStateActions(DEFAULT_JS_COLLECTIONS),
    };

    const updatedJSCollection = klona(DEFAULT_JS_COLLECTIONS[0]);

    updatedJSCollection.actions[0].confirmBeforeExecute = false;

    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS,
      payload: updatedJSCollection as unknown as JSCollection,
    };

    const expectedState = {
      actions: convertActionsToStateActions(DEFAULT_ACTIONS),
      jsCollections: convertActionsToStateActions([updatedJSCollection]),
    };

    const nextState = moduleInstanceEntitiesReducer(currentState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS when payload is action", () => {
    const currentState = {
      actions: convertActionsToStateActions(DEFAULT_ACTIONS),
      jsCollections: convertActionsToStateActions(DEFAULT_JS_COLLECTIONS),
    };

    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS,
      payload: {
        id: "6526621d4b7c8d450a102985",
        name: "QueryModule2",
        moduleId: "652519c44b7c8d700a102356",
        someSetting: false,
        actionConfiguration: {
          timeoutInMillisecond: 10000,
          paginationType: "NONE",
          encodeParamsToggle: true,
          selfReferencingDataPaths: [],
        },
        executeOnLoad: true,
        isValid: true,
      } as unknown as Action,
    };

    const updatedActions = klona(DEFAULT_ACTIONS);
    updatedActions.pop();

    const expectedState = {
      actions: convertActionsToStateActions([
        ...updatedActions,
        action.payload,
      ]),
      jsCollections: currentState.jsCollections,
    };

    const nextState = moduleInstanceEntitiesReducer(currentState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS when payload is jscollection", () => {
    const currentState = {
      actions: convertActionsToStateActions(DEFAULT_ACTIONS),
      jsCollections: convertActionsToStateActions(DEFAULT_JS_COLLECTIONS),
    };

    const updatedJSCollection = klona(DEFAULT_JS_COLLECTIONS[0]);

    updatedJSCollection.actions[0].executeOnLoad = true;

    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS,
      payload: updatedJSCollection as unknown as JSCollection,
    };

    const updatedActions = klona(DEFAULT_ACTIONS);
    updatedActions.pop();

    const expectedState = {
      actions: currentState.actions,
      jsCollections: convertActionsToStateActions([updatedJSCollection]),
    };

    const nextState = moduleInstanceEntitiesReducer(currentState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should reset to initial state on RESET_EDITOR_REQUEST", () => {
    const currentState = {
      actions: convertActionsToStateActions(DEFAULT_ACTIONS),
      jsCollections: convertActionsToStateActions(DEFAULT_JS_COLLECTIONS),
    };

    const result = moduleInstanceEntitiesReducer(currentState, {
      type: ReduxActionTypes.RESET_EDITOR_REQUEST,
      payload: undefined,
    });

    expect(result).toStrictEqual(initialState);
  });
});
