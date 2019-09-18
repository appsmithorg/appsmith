import { FetchPageRequest } from "../api/PageApi";
import { ResponseMeta } from "../api/ApiResponses";
import { RenderMode } from "../constants/WidgetConstants";
import {
  WidgetProps,
  WidgetDynamicProperty,
  WidgetDynamicProperties,
} from "../widgets/BaseWidget";
import {
  ReduxActionTypes,
  ReduxAction,
  LoadCanvasWidgetsPayload,
  SavePagePayload,
  SavePageErrorPayload,
  SavePageSuccessPayload,
} from "../constants/ReduxActionConstants";
import { ContainerWidgetProps } from "../widgets/ContainerWidget";

export const fetchPage = (
  pageId: string,
  renderMode: RenderMode,
): ReduxAction<FetchPageRequest> => {
  return {
    type: ReduxActionTypes.FETCH_PAGE,
    payload: {
      pageId: pageId,
      renderMode: renderMode,
    },
  };
};

export const fetchPageError = (payload: ResponseMeta) => {
  console.log("FETCH PAGE ERROR", payload);
  return {
    type: ReduxActionTypes.FETCH_PAGE_ERROR,
  };
};

export const addWidget = (
  pageId: string,
  widget: WidgetProps,
): ReduxAction<{ pageId: string; widget: WidgetProps }> => {
  return {
    type: ReduxActionTypes.ADD_PAGE_WIDGET,
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
    type: ReduxActionTypes.REMOVE_PAGE_WIDGET,
    payload: {
      pageId,
      widgetId,
    },
  };
};

export const loadCanvasWidgets = (
  payload: LoadCanvasWidgetsPayload,
): ReduxAction<LoadCanvasWidgetsPayload> => {
  return {
    type: ReduxActionTypes.LOAD_CANVAS_WIDGETS,
    payload,
  };
};

export const savePage = (
  pageId: string,
  layoutId: string,
  dsl: ContainerWidgetProps<WidgetProps>,
): ReduxAction<SavePagePayload> => {
  return {
    type: ReduxActionTypes.SAVE_PAGE_INIT,
    payload: { pageId, layoutId, dsl },
  };
};

export const savePageSuccess = (payload: SavePageSuccessPayload) => {
  return {
    type: ReduxActionTypes.SAVE_PAGE_SUCCESS,
    payload,
  };
};

export const savePageError = (payload: SavePageErrorPayload) => {
  return {
    type: ReduxActionTypes.SAVE_PAGE_ERROR,
    payload,
  };
};

export const updateWidget = (
  property: WidgetDynamicProperty,
  widget: WidgetProps,
  payload: any,
) => {
  switch (property) {
    case WidgetDynamicProperties.CHILDREN:
      return;
    case WidgetDynamicProperties.EXISTENCE:
      return;
    case WidgetDynamicProperties.POSITION:
      return;
    case WidgetDynamicProperties.SIZE:
      return;
  }
};
