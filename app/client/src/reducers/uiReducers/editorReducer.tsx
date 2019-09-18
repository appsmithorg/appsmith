import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  LoadCanvasWidgetsPayload,
  LoadWidgetCardsPanePayload,
} from "../../constants/ReduxActionConstants";
import { WidgetCardProps, WidgetProps } from "../../widgets/BaseWidget";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";

const initialState: EditorReduxState = {};

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.SUCCESS_FETCHING_WIDGET_CARDS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadWidgetCardsPanePayload>,
  ) => {
    return { ...state.pageWidget, ...action.payload };
  },
  [ReduxActionTypes.ADD_PAGE_WIDGET]: (
    state: EditorReduxState,
    action: ReduxAction<{ pageId: string; widget: WidgetProps }>,
  ) => {
    return state;
  },
  [ReduxActionTypes.UPDATE_CANVAS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadCanvasWidgetsPayload>,
  ) => {
    return { pageWidgetId: action.payload.pageWidgetId };
  },
});

export interface EditorReduxState {
  pageWidget?: ContainerWidgetProps<any>;
  cards?: {
    [id: string]: WidgetCardProps[];
  };
}

export default editorReducer;
