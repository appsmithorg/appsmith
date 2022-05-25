import { createImmerReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  CMCursorPosition,
  CodeEditorCursorPayload,
  CodeEditorPopupPayload,
  EditingProperty,
  PageContextPayload,
  WidgetContextPayload,
} from "actions/contextActions";
import { isEqual } from "lodash";

const initialState: contextReduxState = {};

const contextReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.UPDATE_PAGE_CONTEXT]: (
    state: contextReduxState,
    action: ReduxAction<PageContextPayload>,
  ) => {
    const { pageId, selectedWidgetIds } = action.payload;
    if (!state[pageId])
      state[pageId] = { selectedWidgetIds: [], codeEditor: {}, widgets: {} };

    if (
      selectedWidgetIds &&
      !isEqual(state[pageId].selectedWidgetIds, selectedWidgetIds)
    ) {
      state[pageId].selectedWidgetIds = selectedWidgetIds;
    }
  },
  [ReduxActionTypes.UPDATE_WIDGET_CONTEXT]: (
    state: contextReduxState,
    action: ReduxAction<WidgetContextPayload>,
  ) => {
    const { editingProperty, pageId, widgetId } = action.payload;
    if (!state[pageId])
      state[pageId] = { selectedWidgetIds: [], codeEditor: {}, widgets: {} };

    if (editingProperty) state[pageId].widgets[widgetId] = editingProperty;
  },
  [ReduxActionTypes.UPDATE_CODE_EDITOR_CURSOR_POSITION]: (
    state: contextReduxState,
    action: ReduxAction<CodeEditorCursorPayload>,
  ) => {
    const {
      cursorPosition: { ch, line },
      fieldName,
      pageId,
      widgetId,
    } = action.payload;
    if (!state[pageId])
      state[pageId] = { selectedWidgetIds: [], codeEditor: {}, widgets: {} };

    if (!state[pageId].codeEditor[widgetId])
      state[pageId].codeEditor[widgetId] = {};

    if (!state[pageId].codeEditor[widgetId][fieldName])
      state[pageId].codeEditor[widgetId][fieldName] = {};

    state[pageId].codeEditor[widgetId][fieldName].cursorPosition = { ch, line };
  },
  [ReduxActionTypes.UPDATE_CODE_EDITOR_POPUP_CONTEXT]: (
    state: contextReduxState,
    action: ReduxAction<CodeEditorPopupPayload>,
  ) => {
    const { fieldName, pageId, popupContext, widgetId } = action.payload;
    if (!state[pageId])
      state[pageId] = { selectedWidgetIds: [], codeEditor: {}, widgets: {} };

    if (!state[pageId].codeEditor[widgetId])
      state[pageId].codeEditor[widgetId] = {};

    if (!state[pageId].codeEditor[widgetId][fieldName])
      state[pageId].codeEditor[widgetId][fieldName] = {};

    state[pageId].codeEditor[widgetId][fieldName].evaluatedPopup = {
      ...popupContext,
    };
  },
});

export interface contextReduxState {
  [pageId: string]: {
    selectedWidgetIds: string[];
    widgets: {
      [widgetId: string]: EditingProperty;
    };
    codeEditor: {
      [widgetId: string]: {
        [fieldName: string]: {
          cursorPosition?: CMCursorPosition;
          evaluatedPopup?: {
            type: boolean;
            example: boolean;
            value: boolean;
          };
        };
      };
    };
  };
}

export default contextReducer;
