import { createReducer } from "../../utils/AppsmithUtils";
import { getEditorConfigs } from "../../constants/ApiConstants";
import { ReduxActionTypes } from "../../constants/ReduxActionConstants";
import { WidgetProps } from "../../widgets/BaseWidget";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";

const editorConfigs = getEditorConfigs();
const initialState: EditorReduxState = {
  pageWidgetId: "0",
  ...editorConfigs,
  isSaving: false,
};

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.SAVE_PAGE_INIT]: (state: EditorReduxState) => {
    return { ...state, isSaving: true };
  },
  [ReduxActionTypes.SAVE_PAGE_SUCCESS]: (state: EditorReduxState) => {
    return { ...state, isSaving: false };
  },
});

export interface EditorReduxState {
  dsl?: ContainerWidgetProps<WidgetProps>;
  pageWidgetId: string;
  currentPageId: string;
  currentLayoutId: string;
  currentPageName: string;
  isSaving: boolean;
}

export default editorReducer;
