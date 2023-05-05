import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  getModulesConfig,
  setModuleConfig,
} from "ce/pages/Applications/helper";

const initialState: ModuleReducerState = {
  config: getModulesConfig(),
};

type SetHasUIPayload = {
  moduleId: string;
  hasUI: boolean;
};

const moduleReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.TOGGLE_HAS_UI]: (
    state: ModuleReducerState,
    action: ReduxAction<SetHasUIPayload>,
  ) => {
    const { moduleId } = action.payload;
    const currentHasUI = state.config[moduleId]?.hasUI || false;

    const config = {
      hasUI: !currentHasUI,
    };
    state.config[moduleId] = config;

    setModuleConfig(moduleId, config);

    return state;
  },
});

export interface ModuleReducerState {
  config: {
    [moduleId: string]: {
      hasUI?: boolean;
    };
  };
}

export default moduleReducer;
