import { klona } from "klona";

import reducer from "./workspaceReducer";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";

const DEFAULT_STATE = {
  loadingStates: {
    fetchingRoles: false,
    isFetchAllRoles: false,
    isFetchAllUsers: false,
    isFetchingWorkspace: false,
    isFetchingPackagesList: false,
  },
  workspaceUsers: [],
  workspaceRoles: [],
  currentWorkspace: {
    id: "",
    name: "",
  },
  packagesList: [],
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
});
