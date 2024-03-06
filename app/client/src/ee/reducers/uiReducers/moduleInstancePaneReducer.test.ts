import moduleInstanceReducer, {
  initialState,
} from "./moduleInstancePaneReducer";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";

describe("moduleInstancePaneReducer", () => {
  it("should handle SAVE_MODULE_INSTANCE_NAME_INIT", () => {
    const action = {
      type: ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_INIT,
      payload: { id: "moduleId" },
    };

    const expectedState = {
      ...initialState,
      nameSavingStatus: {
        moduleId: { isSaving: true, error: false },
      },
    };

    const nextState = moduleInstanceReducer(initialState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle SAVE_MODULE_INSTANCE_NAME_SUCCESS", () => {
    const action = {
      type: ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_SUCCESS,
      payload: { id: "moduleId" },
    };

    const prevState = {
      ...initialState,
      nameSavingStatus: {
        moduleId: { isSaving: true, error: false },
      },
    };

    const expectedState = {
      ...initialState,
      nameSavingStatus: {
        moduleId: { isSaving: false, error: false },
      },
    };

    const nextState = moduleInstanceReducer(prevState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle SAVE_MODULE_INSTANCE_NAME_ERROR", () => {
    const action = {
      type: ReduxActionErrorTypes.SAVE_MODULE_INSTANCE_NAME_ERROR,
      payload: { id: "moduleId" },
    };

    const prevState = {
      ...initialState,
      nameSavingStatus: {
        moduleId: { isSaving: true, error: false },
      },
    };

    const expectedState = {
      ...initialState,
      nameSavingStatus: {
        moduleId: { isSaving: false, error: true },
      },
    };

    const nextState = moduleInstanceReducer(prevState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_SETTINGS_INIT", () => {
    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_INIT,
      payload: { id: "moduleId" },
    };

    const expectedState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: true, error: false },
      },
    };

    const nextState = moduleInstanceReducer(initialState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS", () => {
    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS,
      payload: { id: "moduleId" },
    };

    const prevState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: true, error: false },
      },
    };

    const expectedState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: false, error: false },
      },
    };

    const nextState = moduleInstanceReducer(prevState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_SETTINGS_ERROR", () => {
    const action = {
      type: ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_SETTINGS_ERROR,
      payload: { id: "moduleId" },
    };

    const prevState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: true, error: false },
      },
    };

    const expectedState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: false, error: true },
      },
    };

    const nextState = moduleInstanceReducer(prevState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_INIT", () => {
    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_INIT,
      payload: { actionId: "moduleId" },
    };

    const expectedState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: true, error: false },
      },
    };

    const nextState = moduleInstanceReducer(initialState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS", () => {
    const action = {
      type: ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS,
      payload: { id: "moduleId" },
    };

    const prevState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: true, error: false },
      },
    };

    const expectedState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: false, error: false },
      },
    };

    const nextState = moduleInstanceReducer(prevState, action);
    expect(nextState).toEqual(expectedState);
  });

  it("should handle UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_ERROR", () => {
    const action = {
      type: ReduxActionErrorTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_ERROR,
      payload: { id: "moduleId" },
    };

    const prevState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: true, error: false },
      },
    };

    const expectedState = {
      ...initialState,
      settingsSavingStatus: {
        moduleId: { isSaving: false, error: true },
      },
    };

    const nextState = moduleInstanceReducer(prevState, action);
    expect(nextState).toEqual(expectedState);
  });
});
