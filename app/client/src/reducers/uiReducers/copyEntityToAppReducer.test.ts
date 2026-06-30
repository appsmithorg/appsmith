import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import reducer from "reducers/uiReducers/copyEntityToAppReducer";
import type { ApplicationPayload } from "entities/Application";
import type { ApplicationPagePayload } from "ee/api/ApplicationApi";

const initialState = {
  isModalOpen: false,
  entity: null,
  targetApplications: [],
  isFetchingApplications: false,
  targetPages: [],
  isFetchingPages: false,
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
  it("opens the modal and stores the entity on open, clearing stale in-flight flags", () => {
    const state = reducer(
      {
        ...initialState,
        isFetchingApplications: true,
        isFetchingPages: true,
        isCopying: true,
      },
      {
        type: ReduxActionTypes.OPEN_COPY_ENTITY_TO_APP_MODAL,
        payload: sampleEntity,
      },
    );

    expect(state.isModalOpen).toBe(true);
    expect(state.entity).toEqual(sampleEntity);
    expect(state.targetApplications).toEqual([]);
    expect(state.isFetchingApplications).toBe(false);
    expect(state.isFetchingPages).toBe(false);
    expect(state.isCopying).toBe(false);
  });

  it("closes the modal and clears the entity on close, clearing stale in-flight flags", () => {
    const state = reducer(
      {
        ...initialState,
        isModalOpen: true,
        entity: sampleEntity,
        isFetchingApplications: true,
        isFetchingPages: true,
        isCopying: true,
      },
      { type: ReduxActionTypes.CLOSE_COPY_ENTITY_TO_APP_MODAL, payload: {} },
    );

    expect(state.isModalOpen).toBe(false);
    expect(state.entity).toBeNull();
    expect(state.isFetchingApplications).toBe(false);
    expect(state.isFetchingPages).toBe(false);
    expect(state.isCopying).toBe(false);
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

  it("stores the fetched pages on page fetch success", () => {
    const samplePages = [
      { id: "pg-1", name: "Page1" },
    ] as unknown as ApplicationPagePayload[];

    const fetching = reducer(initialState, {
      type: ReduxActionTypes.FETCH_COPY_TARGET_PAGES_INIT,
      payload: { applicationId: "app-1" },
    });

    expect(fetching.isFetchingPages).toBe(true);
    expect(fetching.targetPages).toEqual([]);

    const done = reducer(fetching, {
      type: ReduxActionTypes.FETCH_COPY_TARGET_PAGES_SUCCESS,
      payload: { pages: samplePages },
    });

    expect(done.isFetchingPages).toBe(false);
    expect(done.targetPages).toEqual(samplePages);
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

  it("resets page fetching state on page fetch error", () => {
    const samplePages = [
      { id: "pg-1", name: "Page1" },
    ] as unknown as ApplicationPagePayload[];

    const state = reducer(
      { ...initialState, isFetchingPages: true, targetPages: samplePages },
      {
        type: ReduxActionErrorTypes.FETCH_COPY_TARGET_PAGES_ERROR,
        payload: {},
      },
    );

    expect(state.isFetchingPages).toBe(false);
    expect(state.targetPages).toEqual([]);
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

  it("toggles isCopying through the JS-object copy lifecycle", () => {
    const copying = reducer(initialState, {
      type: ReduxActionTypes.COPY_JS_ACTION_TO_APP_INIT,
      payload: {},
    });

    expect(copying.isCopying).toBe(true);

    const done = reducer(copying, {
      type: ReduxActionTypes.COPY_JS_ACTION_TO_APP_SUCCESS,
      payload: {},
    });

    expect(done.isCopying).toBe(false);
  });
});
