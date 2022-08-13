import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { FlattenedWidgetProps } from "widgets/constants";

export const addPseudoWidget = (
  payload: Record<string, FlattenedWidgetProps>,
) => ({
  type: ReduxActionTypes.ADD_PSEUDO_WIDGET,
  payload,
});

export const updatePseudoWidget = (
  payload: Record<string, FlattenedWidgetProps>,
) => ({
  type: ReduxActionTypes.UPDATE_PSEUDO_WIDGET,
  payload,
});

export const deletePseudoWidget = (payload: string | string[]) => ({
  type: ReduxActionTypes.DELETE_PSEUDO_WIDGET,
  payload,
});
