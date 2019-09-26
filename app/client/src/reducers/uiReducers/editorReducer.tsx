import { createReducer } from "../../utils/AppsmithUtils";
import { getEditorConfigs } from "../../constants/ApiConstants";
import {
  ReduxActionTypes,
  ReduxAction,
  LoadWidgetCardsPanePayload,
} from "../../constants/ReduxActionConstants";
import { WidgetCardProps, WidgetProps } from "../../widgets/BaseWidget";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
const editorConfigs = getEditorConfigs();
const initialState: EditorReduxState = {
  pageWidgetId: "0",
  ...editorConfigs,
  isSaving: false,
};

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.SUCCESS_FETCHING_WIDGET_CARDS]: (
    state: EditorReduxState,
    action: ReduxAction<LoadWidgetCardsPanePayload>,
  ) => {
    return { ...state, ...action.payload };
  },
  [ReduxActionTypes.SAVE_PAGE_INIT]: (state: EditorReduxState) => {
    return { ...state, isSaving: true };
  },
  [ReduxActionTypes.SAVE_PAGE_SUCCESS]: (state: EditorReduxState) => {
    return { ...state, isSaving: false };
  },
  [ReduxActionTypes.SAVE_PAGE_ERROR]: (state: EditorReduxState) => {
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
