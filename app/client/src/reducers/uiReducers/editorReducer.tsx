import { createReducer } from "../../utils/AppsmithUtils";
import { getEditorConfigs } from "../../constants/ApiConstants";
import {
  ReduxActionTypes,
  ReduxAction,
  LoadWidgetCardsPanePayload,
} from "../../constants/ReduxActionConstants";
import { WidgetCardProps, WidgetProps } from "../../widgets/BaseWidget";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import WidgetCardsPaneResponse from "../../mockResponses/WidgetCardsPaneResponse";

const editorConfigs = getEditorConfigs();
const initialState: EditorReduxState = {
  pageWidgetId: "0",
  ...editorConfigs,
  isSaving: false,
  cards: WidgetCardsPaneResponse,
};

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_WIDGET_CARDS_SUCCESS]: (
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
});

export interface EditorReduxState {
  dsl?: ContainerWidgetProps<WidgetProps>;
  cards: {
    [id: string]: WidgetCardProps[];
  };
  pageWidgetId: string;
  currentPageId: string;
  currentLayoutId: string;
  currentPageName: string;
  isSaving: boolean;
}

export default editorReducer;
