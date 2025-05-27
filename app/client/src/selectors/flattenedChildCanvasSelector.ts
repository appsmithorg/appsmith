import { getCanvasWidgets } from "ee/selectors/entitiesSelector";
import { GridDefaults, type RenderModes } from "constants/WidgetConstants";
import { getLayoutSystem } from "layoutSystems/withLayoutSystemWidgetHOC";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { createSelector } from "reselect";
import { getTemplateMetaWidgets, getRenderMode } from "./editorSelectors";
import { getIsMobileBreakPoint } from "sagas/selectors";
import type { DefaultRootState } from "react-redux";
import type { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "./layoutSystemSelectors";
import type { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";

function buildFlattenedChildCanvasWidgets(
  canvasWidgets: CanvasWidgetsReduxState,
  renderMode: RenderModes,
  layoutSystemType: LayoutSystemTypes,
  isMobile: boolean,
  templateMetaWidgets: MetaWidgetsReduxState,
  parentWidgetId: string,
  flattenedChildCanvasWidgets: Record<string, FlattenedWidgetProps> = {},
) {
  const widgets = {
    ...canvasWidgets,
    ...templateMetaWidgets,
  };

  const parentWidget = widgets[parentWidgetId];
  const {
    widgetSystem: { propertyEnhancer },
  } = getLayoutSystem(renderMode, layoutSystemType);

  parentWidget?.children?.forEach((childId) => {
    const childWidget = widgets[childId];
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
      templateMetaWidgets,
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
    getTemplateMetaWidgets,
    (_state: DefaultRootState, parentWidgetId: string) => parentWidgetId,
  ],
  buildFlattenedChildCanvasWidgets,
);
