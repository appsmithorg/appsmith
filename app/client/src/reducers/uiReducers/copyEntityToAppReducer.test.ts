import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import reducer from "reducers/uiReducers/copyEntityToAppReducer";
import type { ApplicationPayload } from "entities/Application";

const initialState = {
  targetApplications: [],
  isFetchingApplications: false,
  isCopying: false,
};

const sampleApps = [{ id: "app-1" }] as unknown as ApplicationPayload[];

describe("copyEntityToAppReducer", () => {
  it("sets isFetchingApplications and clears the list on fetch init", () => {
    const state = reducer(
      { ...initialState, targetApplications: sampleApps },
      {
        type: ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_INIT,
        payload: {},
      },
    );

    expect(state.isFetchingApplications).toBe(true);
    expect(state.targetApplications).toEqual([]);
  });

  it("stores the fetched applications on fetch success", () => {
    const state = reducer(
      { ...initialState, isFetchingApplications: true },
      {
        type: ReduxActionTypes.FETCH_COPY_TARGET_APPLICATIONS_SUCCESS,
        payload: { applications: sampleApps },
      },
    );

    expect(state.isFetchingApplications).toBe(false);
    expect(state.targetApplications).toEqual(sampleApps);
  });

  it("resets fetching state on fetch error", () => {
    const state = reducer(
      { ...initialState, isFetchingApplications: true },
      {
        type: ReduxActionErrorTypes.FETCH_COPY_TARGET_APPLICATIONS_ERROR,
        payload: {},
      },
    );

    expect(state.isFetchingApplications).toBe(false);
    expect(state.targetApplications).toEqual([]);
  });

  it("toggles isCopying through the copy lifecycle", () => {
    const copying = reducer(initialState, {
      type: ReduxActionTypes.COPY_ACTION_TO_APP_INIT,
      payload: {},
    });

    expect(copying.isCopying).toBe(true);

    const done = reducer(copying, {
      type: ReduxActionTypes.COPY_ACTION_TO_APP_SUCCESS,
      payload: {},
    });

    expect(done.isCopying).toBe(false);

    const failed = reducer(
      { ...initialState, isCopying: true },
      {
        type: ReduxActionErrorTypes.COPY_JS_ACTION_TO_APP_ERROR,
        payload: {},
      },
    );

    expect(failed.isCopying).toBe(false);
  });
});
