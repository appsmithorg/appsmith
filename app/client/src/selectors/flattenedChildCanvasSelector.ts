import { getCanvasWidgets } from "@appsmith/selectors/entitiesSelector";
import { GridDefaults, type RenderModes } from "constants/WidgetConstants";
import { getLayoutSystem } from "layoutSystems/withLayoutSystemHOC";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import type { AppPositioningTypes } from "reducers/entityReducers/pageListReducer";
import { createSelector } from "reselect";
import { getAppPositioningType, getRenderMode } from "./editorSelectors";
import { getIsMobileBreakPoint } from "sagas/selectors";
import type { AppState } from "@appsmith/reducers";

function buildFlattenedChildCanvasWidgets(
  canvasWidgets: CanvasWidgetsReduxState,
  renderMode: RenderModes,
  appPositioningType: AppPositioningTypes,
  isMobile: boolean,
  parentWidgetId: string,
  flattenedChildCanvasWidgets: Record<string, FlattenedWidgetProps> = {},
) {
  const parentWidget = canvasWidgets[parentWidgetId];
  const { propertyEnhancer } = getLayoutSystem(renderMode, appPositioningType);
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
      appPositioningType,
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
    getAppPositioningType,
    getIsMobileBreakPoint,
    (_state: AppState, parentWidgetId: string) => parentWidgetId,
  ],
  buildFlattenedChildCanvasWidgets,
);
