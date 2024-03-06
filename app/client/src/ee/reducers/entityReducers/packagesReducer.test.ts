import { klona } from "klona";

import reducer, {
  initialState,
} from "@appsmith/reducers/entityReducers/packagesReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { PackagesReducerState } from "@appsmith/reducers/entityReducers/packagesReducer";
import type { Package } from "@appsmith/constants/PackageConstants";

const package1 = {
  id: "package-1",
  name: "Package 1",
} as Package;

const package2 = {
  id: "package-2",
  name: "Package 2",
} as Package;

const defaultModules = [
  {
    id: "mod-1",
    name: "Module 1",
  },
];

const DEFAULT_STATE: PackagesReducerState = {};

describe("packageReducer", () => {
  it("CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS - should store the package received in the payload", () => {
    const initialState = DEFAULT_STATE;

    const expectedState = klona(DEFAULT_STATE);
    expectedState[package1.id] = package1;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS,
        payload: package1,
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS - it should not alter the existing packages", () => {
    const initialState = klona(DEFAULT_STATE);
    initialState[package1.id] = package1;

    const expectedState = klona(initialState);
    expectedState[package2.id] = package2;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS,
        payload: package2,
      }),
    ).toEqual(expectedState);
  });

  it("FETCH_PACKAGE_SUCCESS - should store the packageData from the payload in the state", () => {
    const initialState = DEFAULT_STATE;

    const expectedState = klona(DEFAULT_STATE);
    expectedState[package1.id] = package1;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.FETCH_PACKAGE_SUCCESS,
        payload: {
          packageData: package1,
          modules: defaultModules,
        },
      }),
    ).toEqual(expectedState);
  });

  it("FETCH_PACKAGE_SUCCESS - it should not alter the existing packages", () => {
    const initialState = klona(DEFAULT_STATE);
    initialState[package1.id] = package1;

    const expectedState = klona(initialState);
    expectedState[package2.id] = package2;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.FETCH_PACKAGE_SUCCESS,
        payload: {
          packageData: package2,
          modules: defaultModules,
        },
      }),
    ).toEqual(expectedState);
  });

  it("UPDATE_PACKAGE_SUCCESS - should update the respective package color and name for the specific package id in the state", () => {
    const initialState = klona(DEFAULT_STATE);
    initialState[package1.id] = package1;
    initialState[package2.id] = package2;

    const updatedColor = "#000";
    const updatedName = "Package 1 Updated";
    const expectedState = klona(DEFAULT_STATE);
    expectedState[package2.id] = package2;
    expectedState[package1.id] = {
      ...package1,
      color: updatedColor,
      name: updatedName,
    };

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.UPDATE_PACKAGE_SUCCESS,
        payload: {
          ...package1,
          color: updatedColor,
          name: updatedName,
        },
      }),
    ).toEqual(expectedState);
  });

  it("should reset to initial state on RESET_EDITOR_REQUEST", () => {
    const currentState = klona(DEFAULT_STATE);

    const result = reducer(currentState, {
      type: ReduxActionTypes.RESET_EDITOR_REQUEST,
      payload: undefined,
    });

    expect(result).toStrictEqual(initialState);
  });
});
