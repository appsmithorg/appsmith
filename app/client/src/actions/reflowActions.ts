import {
  ReduxAction,
  ReflowReduxActionTypes,
} from "constants/ReduxActionConstants";
import { Reflow } from "reducers/uiReducers/reflowReducer";

export const startReflow = (payload: Reflow): ReduxAction<Reflow> => {
  return {
    type: ReflowReduxActionTypes.START_REFLOW,
    payload: payload,
  };
};

export const reflowMove = (payload: Reflow): ReduxAction<Reflow> => {
  return {
    type: ReflowReduxActionTypes.REFLOW_MOVE,
    payload: payload,
  };
};

export const stopReflow = () => {
  return {
    type: ReflowReduxActionTypes.STOP_REFLOW,
  };
};
