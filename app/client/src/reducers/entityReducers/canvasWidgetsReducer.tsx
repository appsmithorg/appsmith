import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxActionTypes,
  UpdateCanvasPayload,
  ReduxAction,
} from "constants/ReduxActionConstants";
import { WidgetProps } from "widgets/NewBaseWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { UpdateWidgetPropertyPayload } from "actions/controlActions";

const initialState: CanvasWidgetsReduxState = {};

export type FlattenedWidgetProps = ContainerWidgetProps & {
  children?: string[];
};

const canvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.UPDATE_CANVAS]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return { ...action.payload.widgets };
  },
  [ReduxActionTypes.UPDATE_LAYOUT]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    return { ...action.payload.widgets };
  },
  [ReduxActionTypes.UPDATE_WIDGET_PROPERTY]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<UpdateWidgetPropertyPayload>,
  ) => {
    const widget = state[action.payload.widgetId];
    return {
      ...state,
      [action.payload.widgetId]: {
        ...widget,
        [action.payload.propertyName]: action.payload.propertyValue,
      },
    };
  },
});

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
