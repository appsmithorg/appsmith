import { createReducer } from "../../utils/AppsmithUtils";
import { getEditorConfigs } from "../../constants/ApiConstants";
import { ReduxActionTypes } from "../../constants/ReduxActionConstants";
import { WidgetProps } from "../../widgets/BaseWidget";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import {
  ReduxAction,
  UpdateCanvasPayload,
  PageListPayload,
} from "../../constants/ReduxActionConstants";

const editorConfigs = getEditorConfigs();
const initialState: EditorReduxState = {
  pageWidgetId: "0",
  ...editorConfigs,
  pages: [],
  loadingStates: {
    publishing: false,
    publishingError: false,
    saving: false,
    savingError: false,
  },
};

const editorReducer = createReducer(initialState, {
  [ReduxActionTypes.PUBLISH_APPLICATION_INIT]: (state: EditorReduxState) => {
    state.loadingStates.publishing = true;
    state.loadingStates.publishingError = false;
    return { ...state };
  },
  [ReduxActionTypes.PUBLISH_APPLICATION_ERROR]: (state: EditorReduxState) => {
    state.loadingStates.publishing = false;
    state.loadingStates.publishingError = true;
    return { ...state };
  },
  [ReduxActionTypes.PUBLISH_APPLICATION_SUCCESS]: (state: EditorReduxState) => {
    state.loadingStates.publishing = false;
    state.loadingStates.publishingError = false;
    return { ...state };
  },
  [ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS]: (
    state: EditorReduxState,
    action: ReduxAction<PageListPayload>,
  ) => {
    return { ...state, pages: action.payload };
  },
  [ReduxActionTypes.CREATE_PAGE_SUCCESS]: (
    state: EditorReduxState,
    action: ReduxAction<{ pageName: string; pageId: string; layoutId: string }>,
  ) => {
    state.pages.push(action.payload);
    return { ...state };
  },
  [ReduxActionTypes.SAVE_PAGE_INIT]: (state: EditorReduxState) => {
    state.loadingStates.saving = true;
    state.loadingStates.savingError = false;
    return { ...state };
  },
  [ReduxActionTypes.SAVE_PAGE_SUCCESS]: (state: EditorReduxState) => {
    state.loadingStates.saving = false;
    return { ...state };
  },
  [ReduxActionTypes.UPDATE_CANVAS]: (
    state: EditorReduxState,
    action: ReduxAction<UpdateCanvasPayload>,
  ) => {
    const {
      currentPageId,
      currentPageName,
      currentLayoutId,
      pageWidgetId,
      currentApplicationId,
    } = action.payload;
    state.loadingStates.publishing = false;
    state.loadingStates.publishingError = false;
    return {
      ...state,
      currentPageId,
      currentPageName,
      currentLayoutId,
      pageWidgetId,
      currentApplicationId,
    };
  },
});

export interface EditorReduxState {
  dsl?: ContainerWidgetProps<WidgetProps>;
  pageWidgetId: string;
  currentPageId: string;
  currentLayoutId: string;
  currentPageName: string;
  propertyPaneConfigsId: string;
  currentApplicationId?: string;
  pages: PageListPayload;
  loadingStates: {
    saving: boolean;
    savingError: boolean;
    publishing: boolean;
    publishingError: boolean;
  };
}

export default editorReducer;
