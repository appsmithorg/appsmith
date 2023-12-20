import { klona } from "klona";

import reducer, {
  initialState,
} from "@appsmith/reducers/entityReducers/modulesReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ModulesReducerState } from "@appsmith/reducers/entityReducers/modulesReducer";
import type { Module } from "@appsmith/constants/ModuleConstants";

const module2 = {
  id: "mod-2",
  name: "Mod 2",
} as Module;

const module3 = {
  id: "mod-3",
  name: "Mod 3",
} as Module;

const defaultPackage = {
  id: "pkg-1",
  name: "Package 1",
};

const DEFAULT_STATE: ModulesReducerState = {
  "mod-1": {
    id: "mod-1",
    name: "Mod 1",
  } as Module,
};

describe("modulesReducer", () => {
  it("FETCH_PACKAGE_SUCCESS - should store the modules from the payload in the state", () => {
    const initialState = DEFAULT_STATE;

    const expectedState: ModulesReducerState = {};
    expectedState[module2.id] = module2;
    expectedState[module3.id] = module3;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.FETCH_PACKAGE_SUCCESS,
        payload: {
          packageData: defaultPackage,
          modules: [module2, module3],
        },
      }),
    ).toEqual(expectedState);
  });

  it("SAVE_MODULE_NAME_SUCCESS - should updated the respective module name from the payload in the state", () => {
    const initialState = DEFAULT_STATE;
    initialState[module2.id] = module2;
    initialState[module3.id] = module3;

    const updatedName = "Mod 3 Updated";
    const expectedState = klona(DEFAULT_STATE);
    expectedState[module2.id] = module2;
    expectedState[module3.id] = {
      ...module3,
      name: updatedName,
    };

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS,
        payload: {
          ...module3,
          name: updatedName,
        },
      }),
    ).toEqual(expectedState);
  });

  it("DELETE_QUERY_MODULE_SUCCESS - should delete the respective module in the state", () => {
    const initialState = DEFAULT_STATE;
    initialState[module2.id] = module2;
    initialState[module3.id] = module3;

    const expectedState = klona(DEFAULT_STATE);
    delete expectedState[module3.id];

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS,
        payload: {
          id: module3.id,
        },
      }),
    ).toEqual(expectedState);
  });

  it("CREATE_QUERY_MODULE_SUCCESS - should create a new module in the state", () => {
    const initialState = DEFAULT_STATE;
    initialState[module2.id] = module2;

    const expectedState = klona(DEFAULT_STATE);
    expectedState[module2.id] = module2;
    expectedState[module3.id] = module3;

    expect(
      reducer(initialState, {
        type: ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS,
        payload: module3,
      }),
    ).toEqual(expectedState);
  });

  it("should reset to initial state on RESET_EDITOR_REQUEST", () => {
    const currentState = DEFAULT_STATE;

    const result = reducer(currentState, {
      type: ReduxActionTypes.RESET_EDITOR_REQUEST,
      payload: undefined,
    });

    expect(result).toStrictEqual(initialState);
  });
});
