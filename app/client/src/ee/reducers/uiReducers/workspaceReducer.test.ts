import { klona } from "klona";

import type { WorkspaceReduxState } from "@appsmith/reducers/uiReducers/workspaceReducer";
import reducer from "@appsmith/reducers/uiReducers/workspaceReducer";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";

const package1 = {
  id: "pkg-1",
  name: "Package 1",
};

const package2 = {
  id: "pkg-2",
  name: "Package 2",
};

const DEFAULT_STATE: WorkspaceReduxState = {
  loadingStates: {
    fetchingRoles: false,
    isFetchAllRoles: false,
    isFetchAllUsers: false,
    isFetchingWorkspace: false,
    isFetchingPackagesList: false,
    packageCreationRequestMap: {},
  },
  workspaceUsers: [],
  workspaceRoles: [],
  currentWorkspace: {
    id: "",
    name: "",
  },
  packagesList: [],
  groupSuggestions: [],
  isSavingPkgName: false,
  isErrorSavingPkgName: false,
};

describe("workspaceReducer", () => {
  it("FETCH_ALL_PACKAGES_INIT - should set isFetchingPackagesList to true", () => {
    const initialState = DEFAULT_STATE;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.loadingStates.isFetchingPackagesList = true;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.FETCH_ALL_PACKAGES_INIT,
        payload: undefined,
      }),
    ).toEqual(expectedState);
  });

  it("FETCH_ALL_PACKAGES_ERROR - should set isFetchingPackagesList to false", () => {
    const initialState = klona(DEFAULT_STATE);
    initialState.loadingStates.isFetchingPackagesList = true;

    const expectedState = DEFAULT_STATE;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.FETCH_ALL_PACKAGES_ERROR,
        payload: undefined,
      }),
    ).toEqual(expectedState);
  });

  it("FETCH_ALL_PACKAGES_SUCCESS - should set isFetchingPackagesList to false and sets the payload", () => {
    const initialState = klona(DEFAULT_STATE);
    initialState.loadingStates.isFetchingPackagesList = true;

    const payload = [{ name: "test" }];

    const expectedState = klona(DEFAULT_STATE);
    expectedState.packagesList = payload as any;
    expectedState.loadingStates.isFetchingPackagesList = false;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.FETCH_ALL_PACKAGES_SUCCESS,
        payload,
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_INIT - sets true for the workspaceId", () => {
    const workspaceId = "test-workspace-1";

    const initialState = DEFAULT_STATE;
    const expectedState = klona(DEFAULT_STATE);

    expectedState.loadingStates.packageCreationRequestMap[workspaceId] = true;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT,
        payload: {
          workspaceId,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_INIT - does not modify other workspace status", () => {
    const workspaceId1 = "test-workspace-1";
    const workspaceId2 = "test-workspace-2";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId1] = false;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId1] = false;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId2] = true;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_INIT,
        payload: {
          workspaceId: workspaceId2,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS - sets false for the workspaceId", () => {
    const workspaceId = "test-workspace-1";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS,
        payload: {
          workspaceId,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS - does not modify other workspace status", () => {
    const workspaceId1 = "test-workspace-1";
    const workspaceId2 = "test-workspace-2";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId2] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS,
        payload: {
          workspaceId: workspaceId2,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_ERROR - sets false for the workspaceId", () => {
    const workspaceId = "test-workspace-1";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.CREATE_PACKAGE_FROM_WORKSPACE_ERROR,
        payload: {
          workspaceId,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_ERROR - does not modify other workspace status", () => {
    const workspaceId1 = "test-workspace-1";
    const workspaceId2 = "test-workspace-2";

    const initialState = klona(DEFAULT_STATE);
    const expectedState = klona(DEFAULT_STATE);

    initialState.loadingStates.packageCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId1] = true;
    expectedState.loadingStates.packageCreationRequestMap[workspaceId2] = false;

    expect(
      reducer(initialState, {
        type: ReduxActionErrorTypes.CREATE_PACKAGE_FROM_WORKSPACE_ERROR,
        payload: {
          workspaceId: workspaceId2,
        },
      }),
    ).toEqual(expectedState);
  });

  it("DELETE_PACKAGE_SUCCESS - should delete the respective package from the package list", () => {
    const payload = [package1, package2];
    const initialState = klona(DEFAULT_STATE);
    initialState.packagesList = payload as any;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.packagesList = [package1] as any;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.DELETE_PACKAGE_SUCCESS,
        payload: {
          id: "pkg-2",
        },
      }),
    ).toEqual(expectedState);
  });

  it("UPDATE_PACKAGE_SUCCESS - should update the color and name of the respective package from the package list", () => {
    const payload = [package1, package2];
    const updatedPkg = {
      ...package2,
      color: "#000",
      name: "test2 updated",
    };
    const initialState = klona(DEFAULT_STATE);
    initialState.packagesList = payload as any;

    const expectedState = klona(DEFAULT_STATE);
    expectedState.packagesList = [package1, updatedPkg] as any;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.UPDATE_PACKAGE_SUCCESS,
        payload: updatedPkg,
      }),
    ).toEqual(expectedState);
  });
});
