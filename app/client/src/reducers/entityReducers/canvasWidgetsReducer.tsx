import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  LoadCanvasWidgetsPayload,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import { WidgetProps } from "../../widgets/BaseWidget";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";

const initialState: CanvasWidgetsReduxState = {};

export type FlattenedWidgetProps = ContainerWidgetProps<WidgetProps> & {
  children?: string[];
};

const canvasWidgetsReducer = createReducer(initialState, {
  [ReduxActionTypes.LOAD_CANVAS_WIDGETS]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<LoadCanvasWidgetsPayload>,
  ) => {
    return { ...action.payload.widgets };
  },
  [ReduxActionTypes.UPDATE_LAYOUT]: (
    state: CanvasWidgetsReduxState,
    action: ReduxAction<LoadCanvasWidgetsPayload>,
  ) => {
    return { ...action.payload.widgets };
  },
});

export interface CanvasWidgetsReduxState {
  [widgetId: string]: FlattenedWidgetProps;
}

export default canvasWidgetsReducer;
