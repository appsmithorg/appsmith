import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
  LoadCanvasWidgetsPayload,
  LoadWidgetCardsPanePayload,
} from "../../constants/ReduxActionConstants";
import { WidgetCardProps, WidgetProps } from "../../widgets/BaseWidget";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";

const initialState: EditorReduxState = {
  pageWidgetId: "0",
};

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.SUCCESS_FETCHING_WIDGET_CARDS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadWidgetCardsPanePayload>,
  ) => {
    return { ...state.layout, ...action.payload };
  },
  [ReduxActionTypes.ADD_PAGE_WIDGET]: (state: EditorReduxState) => {
    return state;
  },
  [ReduxActionTypes.LOAD_CANVAS_WIDGETS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadCanvasWidgetsPayload>,
  ) => {
    return { pageWidgetId: action.payload.pageWidgetId };
  },
});

export interface EditorReduxState {
  layout?: ContainerWidgetProps<WidgetProps>;
  cards?: {
    [id: string]: WidgetCardProps[];
  };
  pageWidgetId: string;
}

export default editorReducer;
