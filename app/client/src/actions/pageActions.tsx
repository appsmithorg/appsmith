import {
  ReduxAction,
  ReduxActionTypes
} from "../constants/ReduxActionConstants"
import { PageRequest } from "../api/PageApi"
import { RenderMode } from "../constants/WidgetConstants";
import { IWidgetProps } from "../widgets/BaseWidget";

export const fetchPage = (pageId: string, renderMode: RenderMode): ReduxAction<PageRequest> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE,
    payload: {
      pageId: pageId,
      renderMode: renderMode
    }
  }
}

export const addWidget = (pageId: string, widget: IWidgetProps): ReduxAction<{ pageId: string, widget: IWidgetProps}> => {
  return {
    type: ReduxActionTypes.ADD_PAGE_WIDGET,
    payload: {
      pageId,
      widget,
    }
  }
}

export const removeWidget = (pageId: string, widgetId: string): ReduxAction<{ pageId: string, widgetId: string}> => {
  return {
    type: ReduxActionTypes.REMOVE_PAGE_WIDGET,
    payload: {
      pageId,
      widgetId,
    }
  }
}