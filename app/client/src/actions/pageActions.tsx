import { ReduxAction, ActionTypes } from "../constants/ActionConstants";
import { PageRequest } from "../api/PageApi";
import { RenderMode } from "../constants/WidgetConstants";
import { WidgetProps } from "../widgets/BaseWidget";

export const fetchPage = (
  pageId: string,
  renderMode: RenderMode,
): ReduxAction<PageRequest> => {
  return {
    type: ActionTypes.FETCH_PAGE,
    payload: {
      pageId: pageId,
      renderMode: renderMode,
    },
  };
};

export const addWidget = (
  pageId: string,
  widget: WidgetProps,
): ReduxAction<{ pageId: string; widget: WidgetProps }> => {
  return {
    type: ActionTypes.ADD_PAGE_WIDGET,
    payload: {
      pageId,
      widget,
    },
  };
};

export const removeWidget = (
  pageId: string,
  widgetId: string,
): ReduxAction<{ pageId: string; widgetId: string }> => {
  return {
    type: ActionTypes.REMOVE_PAGE_WIDGET,
    payload: {
      pageId,
      widgetId,
    },
  };
};
