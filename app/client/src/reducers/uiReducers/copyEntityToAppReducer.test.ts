import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import reducer from "reducers/uiReducers/copyEntityToAppReducer";
import type { ApplicationPayload } from "entities/Application";

const initialState = {
  isModalOpen: false,
  entity: null,
  targetApplications: [],
  isFetchingApplications: false,
  isCopying: false,
};

const sampleApps = [{ id: "app-1" }] as unknown as ApplicationPayload[];

const sampleEntity = {
  entityType: "ACTION",
  entityId: "entity-1",
  entityName: "Query1",
  sourcePageId: "page-1",
};

describe("copyEntityToAppReducer", () => {
  it("opens the modal and stores the entity on open", () => {
    const state = reducer(initialState, {
      type: ReduxActionTypes.OPEN_COPY_ENTITY_TO_APP_MODAL,
      payload: sampleEntity,
    });

    expect(state.isModalOpen).toBe(true);
    expect(state.entity).toEqual(sampleEntity);
    expect(state.targetApplications).toEqual([]);
  });

  it("closes the modal and clears the entity on close", () => {
    const state = reducer(
      { ...initialState, isModalOpen: true, entity: sampleEntity },
      { type: ReduxActionTypes.CLOSE_COPY_ENTITY_TO_APP_MODAL, payload: {} },
    );

    expect(state.isModalOpen).toBe(false);
    expect(state.entity).toBeNull();
  });

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
