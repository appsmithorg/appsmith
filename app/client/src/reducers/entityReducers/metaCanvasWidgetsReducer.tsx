import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";

export type MetaCanvasWidgetsReduxState = {
  [widgetId: string]: FlattenedWidgetProps;
};

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

const initialState: MetaCanvasWidgetsReduxState = {};

const metaCanvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.ADD_PSEUDO_WIDGET]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return action.payload.widgets;
  },
  [ReduxActionTypes.UPDATE_PSEUDO_WIDGET]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return action.payload.widgets;
  },
  [ReduxActionTypes.DELETE_PSEUDO_WIDGET]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return action.payload.widgets;
  },
});

export default metaCanvasWidgetsReducer;
