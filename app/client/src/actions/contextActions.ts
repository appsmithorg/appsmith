import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";

export enum PropertyType {
  CODE_EDITOR = "CODE_EDITOR",
}

export type EditingProperty = {
  propertyName?: string;
  propertyType?: PropertyType;
  widgetId?: string;
};

export type CMCursorPosition = {
  line: number;
  ch: number;
};

export type CMPopupContext = {
  type: boolean;
  example: boolean;
  value: boolean;
};

export type PageContextPayload = {
  pageId: string;
  selectedWidgetIds?: string[];
};

export type WidgetContextPayload = {
  pageId: string;
  widgetId: string;
  editingProperty?: EditingProperty;
};

export type CodeEditorCursorPayload = {
  pageId: string;
  widgetId: string;
  fieldName: string;
  cursorPosition: CMCursorPosition;
};

export type CodeEditorPopupPayload = {
  pageId: string;
  widgetId: string;
  fieldName: string;
  popupContext: CMPopupContext;
};

export const updateSelectedWidgets = (
  pageId: string,
  selectedWidgetIds: string[],
) => {
  return {
    type: ReduxActionTypes.UPDATE_PAGE_CONTEXT,
    payload: {
      pageId,
      selectedWidgetIds,
    },
  };
};

export const updateEditingProperty = (
  pageId: string,
  widgetId: string,
  editingProperty: EditingProperty,
) => {
  return {
    type: ReduxActionTypes.UPDATE_WIDGET_CONTEXT,
    payload: {
      pageId,
      widgetId,
      editingProperty,
    },
  };
};

export const updateCodeEditorCursor = (
  pageId: string,
  widgetId: string,
  fieldName: string,
  cursorPosition: CMCursorPosition,
) => {
  return {
    type: ReduxActionTypes.UPDATE_CODE_EDITOR_CURSOR_POSITION,
    payload: {
      pageId,
      widgetId,
      fieldName,
      cursorPosition,
    },
  };
};

export const updateCodeEditorPopup = (
  pageId: string,
  widgetId: string,
  fieldName: string,
  popupContext: CMPopupContext,
) => {
  return {
    type: ReduxActionTypes.UPDATE_CODE_EDITOR_POPUP_CONTEXT,
    payload: {
      pageId,
      widgetId,
      fieldName,
      popupContext,
    },
  };
};

export const restoreEditorContext = () => {
  return {
    type: ReduxActionTypes.RESTORE_EDITOR_CONTEXT,
  };
};
