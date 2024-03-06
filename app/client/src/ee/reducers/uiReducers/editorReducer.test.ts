import reducer, { initialState } from "./editorReducer"; // Import the reducer and its initial state

import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";

describe("Your Reducer", () => {
  it("should handle INITIALIZE_PACKAGE_EDITOR_SUCCESS", () => {
    const action = {
      type: ReduxActionTypes.INITIALIZE_PACKAGE_EDITOR_SUCCESS,
      payload: undefined,
    };

    const state = reducer(initialState, action);

    expect(state.isPackageEditorInitialized).toBe(true);
  });

  it("should handle INITIALIZE_PACKAGE_EDITOR", () => {
    const action = {
      type: ReduxActionTypes.INITIALIZE_PACKAGE_EDITOR,
      payload: undefined,
    };

    const state = reducer(
      { ...initialState, isPackageEditorInitialized: true },
      action,
    );

    expect(state.isPackageEditorInitialized).toBe(false);
  });

  it("should handle SET_CURRENT_PACKAGE_ID", () => {
    const packageId = "your_package_id";
    const action = {
      type: ReduxActionTypes.SET_CURRENT_PACKAGE_ID,
      payload: { packageId },
    };

    const state = reducer(initialState, action);

    expect(state.currentPackageId).toBe(packageId);
  });

  it("should handle FETCH_MODULE_ENTITIES_INIT", () => {
    const action = {
      type: ReduxActionTypes.FETCH_MODULE_ENTITIES_INIT,
      payload: undefined,
    };

    const state = reducer(initialState, action);

    expect(state.isModuleFetchingEntities).toBe(true);
  });

  it("should handle FETCH_MODULE_ENTITIES_SUCCESS", () => {
    const action = {
      type: ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS,
      payload: undefined,
    };

    const state = reducer(
      { ...initialState, isModuleFetchingEntities: true },
      action,
    );

    expect(state.isModuleFetchingEntities).toBe(false);
  });

  it("should handle FETCH_MODULE_ENTITIES_ERROR", () => {
    const action = {
      type: ReduxActionErrorTypes.FETCH_MODULE_ENTITIES_ERROR,
      payload: undefined,
    };

    const state = reducer(
      { ...initialState, isModuleFetchingEntities: true },
      action,
    );

    expect(state.isModuleFetchingEntities).toBe(false);
  });

  it("should handle UPDATE_MODULE_INPUTS_INIT", () => {
    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INPUTS_INIT,
      payload: undefined,
    };

    const state = reducer({ ...initialState, isModuleUpdating: false }, action);

    expect(state.isModuleUpdating).toBe(true);
  });

  it("should handle UPDATE_MODULE_INPUTS_SUCCESS", () => {
    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INPUTS_SUCCESS,
      payload: undefined,
    };

    const state = reducer({ ...initialState, isModuleUpdating: true }, action);

    expect(state.isModuleUpdating).toBe(false);
  });

  it("should handle UPDATE_MODULE_INPUTS_ERROR", () => {
    const action = {
      type: ReduxActionErrorTypes.UPDATE_MODULE_INPUTS_ERROR,
      payload: undefined,
    };

    const state = reducer({ ...initialState, isModuleUpdating: true }, action);

    expect(state.isModuleUpdating).toBe(false);
  });

  it("should handle SAVE_MODULE_NAME_INIT", () => {
    const action = {
      type: ReduxActionTypes.SAVE_MODULE_NAME_INIT,
      payload: undefined,
    };

    const state = reducer({ ...initialState, isModuleUpdating: false }, action);

    expect(state.isModuleUpdating).toBe(true);
  });

  it("should handle SAVE_MODULE_NAME_SUCCESS", () => {
    const action = {
      type: ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS,
      payload: undefined,
    };

    const state = reducer({ ...initialState, isModuleUpdating: true }, action);

    expect(state.isModuleUpdating).toBe(false);
  });

  it("should handle SAVE_MODULE_NAME_ERROR", () => {
    const action = {
      type: ReduxActionErrorTypes.SAVE_MODULE_NAME_ERROR,
      payload: undefined,
    };

    const state = reducer({ ...initialState, isModuleUpdating: true }, action);

    expect(state.isModuleUpdating).toBe(false);
  });

  it("should handle UPDATE_MODULE_INSTANCE_INIT", () => {
    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_INIT,
      payload: undefined,
    };

    const initState = {
      ...initialState,
      loadingStates: {
        ...initialState.loadingStates,
        savingEntity: false,
      },
    };

    const state = reducer(initState, action);

    expect(state.loadingStates.savingEntity).toBe(true);
  });

  it("should handle UPDATE_MODULE_INSTANCE_SUCCESS", () => {
    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SUCCESS,
      payload: undefined,
    };

    const initState = {
      ...initialState,
      loadingStates: {
        ...initialState.loadingStates,
        savingEntity: true,
      },
    };

    const state = reducer(initState, action);

    expect(state.loadingStates.savingEntity).toBe(false);
  });

  it("should handle UPDATE_MODULE_INSTANCE_ERROR", () => {
    const action = {
      type: ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_ERROR,
      payload: undefined,
    };

    const initState = {
      ...initialState,
      loadingStates: {
        ...initialState.loadingStates,
        savingEntity: true,
      },
    };

    const state = reducer(initState, action);

    expect(state.loadingStates.savingEntity).toBe(false);
  });
});
