import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import actionsReducer from "./actionsReducer";
import type { ActionDataState } from "./actionsReducer";
import type { Action } from "entities/Action";
import { klona } from "klona";

const DEFAULT_ACTIONS = [
  {
    id: "65265ab24b7c8d700a10265e",
    name: "QueryModule1",
    moduleId: "652519c44b7c8d700a102643",
    isPublic: true,
    actionConfiguration: {
      timeoutInMillisecond: 10000,
      paginationType: "NONE",
    },
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
    isPublic: false,
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
    isPublic: true,
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

describe("actionsReducer", () => {
  it("should return the initial state", () => {
    const initialState: ActionDataState = [];
    const action = { type: "UNKNOWN_ACTION", payload: {} };
    const state = actionsReducer(undefined, action);
    expect(state).toEqual(initialState);
  });

  it("should handle FETCH_MODULE_ENTITIES_SUCCESS action", () => {
    const initialState: ActionDataState = [];
    const actionPayload = DEFAULT_ACTIONS;

    const action = {
      type: ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS,
      payload: {
        actions: actionPayload,
        jsCollections: [{ id: "js-collection" }],
      },
    };

    const state = actionsReducer(initialState, action);

    expect(state.length).toBe(actionPayload.length);

    // Check if the state contains the expected data
    actionPayload.forEach((action, index) => {
      const stateAction = state[index];
      expect(stateAction.data).toBe(undefined);
      expect(stateAction.isLoading).toBe(false);
      expect(stateAction.config).toBe(action);
    });

    // Check if the state retains any additional items not replaced
    const additionalAction = {
      id: "6525302c4b7c8d700a10264a",
      moduleId: "652519c44b7c8d700a102640",
      actionConfiguration: {
        timeoutInMillisecond: 10000,
        paginationType: "NONE",
      },
      executeOnLoad: false,
      isValid: true,
      eventData: {},
      selfReferencingDataPaths: [],
    };

    const updatedState: ActionDataState = actionsReducer(state, {
      type: ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS,
      payload: { actions: [additionalAction], jsCollection: { id: "test-id" } },
    });

    expect(updatedState.length).toBe(1);

    // Check if the additional action is present in the state
    expect(
      updatedState.some((action) => action.config.id === additionalAction.id),
    ).toBe(true);
  });

  it("should handle CONVERT_ENTITY_TO_INSTANCE_INIT", () => {
    const initialState: ActionDataState = DEFAULT_ACTIONS.map((a) => ({
      config: a,
      isLoading: false,
    }));

    const entityId = DEFAULT_ACTIONS[0].id;

    const action = {
      type: ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_INIT,
      payload: {
        publicEntityId: entityId,
      },
    };

    const state: ActionDataState = actionsReducer(initialState, action);

    state.forEach((a) => {
      if (a.config.id === entityId) {
        expect(a.isConverting).toBe(true);
      } else {
        expect(a.isConverting).toBe(undefined);
      }
    });
  });

  it("should handle CONVERT_ENTITY_TO_INSTANCE_SUCCESS", () => {
    const initialState: ActionDataState = DEFAULT_ACTIONS.map((a) => ({
      config: a,
      isLoading: false,
    }));

    const entityId = DEFAULT_ACTIONS[0].id;

    const action = {
      type: ReduxActionTypes.CONVERT_ENTITY_TO_INSTANCE_SUCCESS,
      payload: {
        originalEntityId: entityId,
      },
    };

    const state: ActionDataState = actionsReducer(initialState, action);

    const entity = state.find((a) => a.config.id === entityId);
    expect(entity).toBe(undefined);
  });

  it("should handle CONVERT_ENTITY_TO_INSTANCE_ERROR", () => {
    const initialState: ActionDataState = klona(DEFAULT_ACTIONS).map((a) => ({
      config: a,
      isLoading: false,
    }));

    const entityId = DEFAULT_ACTIONS[0].id;
    initialState[0].isConverting = true;

    const action = {
      type: ReduxActionErrorTypes.CONVERT_ENTITY_TO_INSTANCE_ERROR,
      payload: {
        publicEntityId: entityId,
      },
    };

    const state: ActionDataState = actionsReducer(initialState, action);

    state.forEach((a) => {
      if (a.config.id === entityId) {
        expect(a.isConverting).toBe(false);
      } else {
        expect(a.isConverting).toBe(undefined);
      }
    });
  });
});
