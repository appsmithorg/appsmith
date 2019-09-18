import {
  ReduxActionTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";
import { ActionPayload } from "../constants/ActionConstants";

export const executeAction = (
  actionPayloads?: ActionPayload[],
): ReduxAction<ActionPayload[] | undefined> => {
  return {
    type: ReduxActionTypes.EXECUTE_ACTION,
    payload: actionPayloads,
  };
};
