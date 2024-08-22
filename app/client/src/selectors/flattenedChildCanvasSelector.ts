import { GridDefaults, type RenderModes } from "constants/WidgetConstants";
import type { AppState } from "ee/reducers";
import { getCanvasWidgets } from "ee/selectors/entitiesSelector";
import type { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystem } from "layoutSystems/withLayoutSystemWidgetHOC";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { createSelector } from "reselect";
import { getIsMobileBreakPoint } from "sagas/selectors";

import { getRenderMode } from "./editorSelectors";
import { getLayoutSystemType } from "./layoutSystemSelectors";

function buildFlattenedChildCanvasWidgets(
  canvasWidgets: CanvasWidgetsReduxState,
  renderMode: RenderModes,
  layoutSystemType: LayoutSystemTypes,
  isMobile: boolean,
  parentWidgetId: string,
  flattenedChildCanvasWidgets: Record<string, FlattenedWidgetProps> = {},
) {
  const parentWidget = canvasWidgets[parentWidgetId];
  const {
    widgetSystem: { propertyEnhancer },
  } = getLayoutSystem(renderMode, layoutSystemType);
  parentWidget?.children?.forEach((childId) => {
    const childWidget = canvasWidgets[childId];
    let parentRowSpace =
      childWidget.parentRowSpace ?? GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
    if (childWidget.type === "CANVAS_WIDGET") {
      parentRowSpace = 1;
    }
    flattenedChildCanvasWidgets[childId] = propertyEnhancer({
      ...childWidget,
      isMobile,
      parentRowSpace,
    });

    buildFlattenedChildCanvasWidgets(
      canvasWidgets,
      renderMode,
      layoutSystemType,
      isMobile,
      childId,
      flattenedChildCanvasWidgets,
    );
  });

  return flattenedChildCanvasWidgets;
}

export const getFlattenedChildCanvasWidgets = createSelector(
  [
    getCanvasWidgets,
    getRenderMode,
    getLayoutSystemType,
    getIsMobileBreakPoint,
    (_state: AppState, parentWidgetId: string) => parentWidgetId,
  ],
  buildFlattenedChildCanvasWidgets,
);
