import { ReduxActionTypes } from "constants/ReduxActionConstants";
import configureStore from "redux-mock-store";
import { AppThemingMode } from "selectors/appThemingSelectors";
import {
  changeSelectedAppThemeAction,
  deleteAppThemeAction,
  fetchAppThemesAction,
  fetchSelectedAppThemeAction,
  saveSelectedThemeAction,
  setAppThemingModeStackAction,
  setPreviewAppThemeAction,
  updateSelectedAppThemeAction,
} from "./appThemingActions";

describe("Unit test for appThming Actions", () => {
  const mockStore = configureStore([]);
  const store = mockStore({});
  const appThemeConfig = {
    id: "",
    name: "",
    created_by: "",
    created_at: "",
    config: {
      colors: {
        backgroundColor: "#f6f6f6",
        primaryColor: "",
        secondaryColor: "",
      },
      borderRadius: {},
      boxShadow: {},
      fontFamily: {},
    },
    properties: {
      colors: {
        backgroundColor: "#f6f6f6",
        primaryColor: "",
        secondaryColor: "",
      },
      borderRadius: {},
      boxShadow: {},
      fontFamily: {},
    },
    stylesheet: {},
  };

  beforeEach(() => {
    store.clearActions();
  });

  it("test: action dispatched = FETCH_APP_THEMES_INIT", () => {
    const expectedAction = [
      {
        type: ReduxActionTypes.FETCH_APP_THEMES_INIT,
        payload: {
          applicationId: "1234",
        },
      },
    ];
    store.dispatch(fetchAppThemesAction("1234"));
    expect(store.getActions()).toEqual(expectedAction);
  });

  it("test: action dispatched = SET_APP_THEMING_STACK", () => {
    store.dispatch(
      setAppThemingModeStackAction([AppThemingMode.APP_THEME_EDIT]),
    );
    const expectedAction = [
      { type: "SET_APP_THEMING_STACK", payload: ["APP_THEME_EDIT"] },
    ];
    expect(store.getActions()).toEqual(expectedAction);
  });

  it("test: action dispatched = FETCH_SELECTED_APP_THEME_INIT", () => {
    store.dispatch(fetchSelectedAppThemeAction("123"));
    const expectedAction = [
      {
        type: "FETCH_SELECTED_APP_THEME_INIT",
        payload: {
          applicationId: "123",
        },
      },
    ];
    expect(store.getActions()).toEqual(expectedAction);
  });

  it("test: action dispatched = UPDATE_SELECTED_APP_THEME_INIT", () => {
    store.dispatch(
      updateSelectedAppThemeAction({
        applicationId: "123",
        theme: appThemeConfig,
        shouldReplay: true,
      }),
    );

    const expectedAction = [
      {
        type: "UPDATE_SELECTED_APP_THEME_INIT",
        payload: {
          applicationId: "123",
          shouldReplay: true,
          theme: appThemeConfig,
        },
      },
    ];
    expect(store.getActions()).toEqual(expectedAction);
  });

  it("test: action dispatched = CHANGE_SELECTED_APP_THEME_INIT", () => {
    store.dispatch(
      changeSelectedAppThemeAction({
        applicationId: "123",
        theme: appThemeConfig,
        shouldReplay: true,
      }),
    );

    const expectedAction = [
      {
        type: "CHANGE_SELECTED_APP_THEME_INIT",
        payload: {
          applicationId: "123",
          shouldReplay: true,
          theme: appThemeConfig,
        },
      },
    ];
    expect(store.getActions()).toEqual(expectedAction);
  });

  it("test: action dispatched = SET_PREVIEW_APP_THEME", () => {
    store.dispatch(setPreviewAppThemeAction(appThemeConfig));

    const expectedAction = [
      {
        type: "SET_PREVIEW_APP_THEME",
        payload: appThemeConfig,
      },
    ];
    expect(store.getActions()).toEqual(expectedAction);
  });

  it("test: action dispatched = SAVE_APP_THEME_INIT", () => {
    store.dispatch(
      saveSelectedThemeAction({
        applicationId: "1234",
        name: "default",
      }),
    );

    const expectedAction = [
      {
        type: "SAVE_APP_THEME_INIT",
        payload: {
          applicationId: "1234",
          name: "default",
        },
      },
    ];
    expect(store.getActions()).toEqual(expectedAction);
  });

  it("test: action dispatched = DELETE_APP_THEME_INIT", () => {
    store.dispatch(
      deleteAppThemeAction({
        themeId: "1",
        name: "default",
      }),
    );

    const expectedAction = [
      {
        type: "DELETE_APP_THEME_INIT",
        payload: {
          themeId: "1",
          name: "default",
        },
      },
    ];
    expect(store.getActions()).toEqual(expectedAction);
  });
});
