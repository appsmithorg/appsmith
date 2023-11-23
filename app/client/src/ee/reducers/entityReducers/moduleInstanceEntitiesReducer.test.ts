import type { Action } from "entities/Action";
import moduleInstanceEntitiesReducer from "./moduleInstanceEntitiesReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { klona } from "klona";

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

const convertActionsToStateActions = (actions: Action[]) => {
  return actions.map((a) => ({
    isLoading: false,
    config: a,
  }));
};

describe("moduleInstanceEntitiesReducer", () => {
  it("should handle UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS", () => {
    const currentState = {
      actions: convertActionsToStateActions(DEFAULT_ACTIONS),
      jsCollections: [],
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
      jsCollections: [],
    };

    const nextState = moduleInstanceEntitiesReducer(currentState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS", () => {
    const currentState = {
      actions: convertActionsToStateActions(DEFAULT_ACTIONS),
      jsCollections: [],
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
      jsCollections: [],
    };

    const nextState = moduleInstanceEntitiesReducer(currentState, action);
    expect(nextState).toEqual(expectedState);
  });

  // Add more test cases for other actions if needed
});
