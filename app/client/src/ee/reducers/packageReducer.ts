import { createImmerReducer } from "utils/ReducerUtils";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Package } from "@appsmith/constants/PackageConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";

type ID = string;

type PackageReducerState = Record<ID, Package>;

const INITIAL_STATE: PackageReducerState = {};

const packageReducer = createImmerReducer(INITIAL_STATE, {
  [ReduxActionTypes.CREATE_PACKAGE_FROM_WORKSPACE_SUCCESS]: (
    draftState: PackageReducerState,
    action: ReduxAction<Package>,
  ) => {
    const { payload } = action;
    draftState[payload.id] = payload;

    return draftState;
  },
});

export default packageReducer;
