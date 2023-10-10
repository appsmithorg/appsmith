import { klona } from "klona";

import reducer from "@appsmith/reducers/entityReducers/modulesReducer";
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

    const expectedState = klona(DEFAULT_STATE);
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
});
