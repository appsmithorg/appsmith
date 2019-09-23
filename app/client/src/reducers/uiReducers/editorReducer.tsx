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
  currentPageId: "5d807e76795dc6000482bc76",
  currentLayoutId: "5d807e76795dc6000482bc75",
  isSaving: false,
};

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.SUCCESS_FETCHING_WIDGET_CARDS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadWidgetCardsPanePayload>,
  ) => {
    return { ...state, ...action.payload };
  },
  [ReduxActionTypes.LOAD_CANVAS_WIDGETS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadCanvasWidgetsPayload>,
  ) => {
    return { ...state, pageWidgetId: action.payload.pageWidgetId };
  },
  [ReduxActionTypes.SAVE_PAGE_INIT]: (state: EditorReduxState) => {
    return { ...state, isSaving: true };
  },
  [ReduxActionTypes.SAVE_PAGE_SUCCESS]: (state: EditorReduxState) => {
    return { ...state, isSaving: false };
  },
  [ReduxActionTypes.SAVE_PAGE_ERROR]: (state: EditorReduxState) => {
    // TODO(abhinav): It will be painful to handle all errors like this
    // make this generic and global toasts to show messages on error.
    return { ...state, isSaving: false };
  },
});

export interface EditorReduxState {
  dsl?: ContainerWidgetProps<WidgetProps>;
  cards?: {
    [id: string]: WidgetCardProps[];
  };
  pageWidgetId: string;
  currentPageId: string;
  currentLayoutId: string;
  isSaving: boolean;
}

export default editorReducer;
