import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export interface StateInspector {
  status: boolean;
  selectedStack: any[];
}
const initialState: StateInspector = {
  status: false,
  selectedStack: [],
};

const stateInspectorReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.STATE_INSPECTOR_OPEN]: (state: StateInspector) => {
    state.status = true;
  },
  [ReduxActionTypes.STATE_INSPECTOR_CLOSE]: (state: StateInspector) => {
    state.status = true;
  },
});

export default stateInspectorReducer;
