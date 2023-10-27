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

  it("should handle FETCH_MODULE_ACTIONS_INIT", () => {
    const action = {
      type: ReduxActionTypes.FETCH_MODULE_ACTIONS_INIT,
      payload: undefined,
    };

    const state = reducer(initialState, action);

    expect(state.isModuleFetchingActions).toBe(true);
  });

  it("should handle FETCH_MODULE_ACTIONS_SUCCESS", () => {
    const action = {
      type: ReduxActionTypes.FETCH_MODULE_ACTIONS_SUCCESS,
      payload: undefined,
    };

    const state = reducer(
      { ...initialState, isModuleFetchingActions: true },
      action,
    );

    expect(state.isModuleFetchingActions).toBe(false);
  });

  it("should handle FETCH_MODULE_ACTIONS_ERROR", () => {
    const action = {
      type: ReduxActionErrorTypes.FETCH_MODULE_ACTIONS_ERROR,
      payload: undefined,
    };

    const state = reducer(
      { ...initialState, isModuleFetchingActions: true },
      action,
    );

    expect(state.isModuleFetchingActions).toBe(false);
  });
});
