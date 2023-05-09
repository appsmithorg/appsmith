import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const initialState: any = {
  packages: {},
  modules: {},
};

const packageReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.FETCH_PACKAGES_SUCCESS]: (
    state: any,
    action: ReduxAction<{ pkg: any; modules: any }>,
  ) => {
    const { modules, pkg } = action.payload;

    state["packages"][pkg.id] = pkg;
    (modules || []).forEach((module: any) => {
      state["modules"][module.id] = module;
    });

    return state;
  },
});

export default packageReducer;
