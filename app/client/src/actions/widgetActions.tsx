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

export const loadingAction = (
  areLoading: boolean,
  widgetIds: string[],
): ReduxAction<WidgetLoadingState> => {
  return {
    type: ReduxActionTypes.LOADING_ACTION,
    payload: {
      areLoading: areLoading,
      widgetIds: widgetIds,
    },
  };
};

export type WidgetLoadingState = {
  areLoading: boolean;
  widgetIds: string[];
};
