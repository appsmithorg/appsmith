import type { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";
import { getFocusedWidget, getSelectedWidgets } from "selectors/ui";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getWidgets } from "sagas/selectors";
import { getShouldShowWidgetName } from "@appsmith/selectors/entitiesSelector";
import { WidgetNameState } from "./WidgetNamesCanvas/WidgetNameConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { EVAL_ERROR_PATH } from "utils/DynamicBindingUtils";
import get from "lodash/get";
import { getErrorCount } from "layoutSystems/common/widgetName/utils";
import type { LayoutElementPositions } from "./types";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WidgetNameData } from "./WidgetNamesCanvas/WidgetNameTypes";
import type { DataTree } from "entities/DataTree/dataTreeTypes";

export const getLayoutElementPositions = (state: AppState) =>
  state.entities.layoutElementPositions;

/**
 * method to get the widget data required to draw widget name component on canvas
 * @param widget widget whose widget name will be drawn on canvas
 * @param dataTree contains evaluated widget information that is used to check of the widget has any errors
 * @param positions positions of all the widgets in pixels
 * @param isFocused boolean to indicate if the widget is focused
 * @returns WidgetNameData object which contains information regarding the widget to draw it's widget name on canvas
 */
const getWidgetNameState = (
  widget: WidgetProps,
  dataTree: DataTree,
  positions: LayoutElementPositions,
  isFocused = false,
): WidgetNameData => {
  let nameState = isFocused
    ? WidgetNameState.FOCUSED
    : WidgetNameState.SELECTED;

  const widgetName = widget.widgetName;

  const widgetEntity = dataTree[widgetName];

  const parentId = widget.parentId || MAIN_CONTAINER_WIDGET_ID;

  if (widgetEntity) {
    const errorObj = get(widgetEntity, EVAL_ERROR_PATH, {});
    const errorCount = getErrorCount(errorObj);

    if (errorCount > 0) {
      nameState = WidgetNameState.ERROR;
    }
  }

  const widgetNameData = {
    id: widget.widgetId,
    position: positions[widget.widgetId],
    widgetName: widgetName,
    parentId,
    dragDisabled: widget.dragDisabled,
    nameState,
  };

  return widgetNameData;
};

/**
 * selector to get information regarding the selected widget to draw it's widget name on canvas
 */
export const getSelectedWidgetNameData = createSelector(
  getLayoutElementPositions,
  getSelectedWidgets,
  getWidgets,
  getDataTree,
  getShouldShowWidgetName,
  (
    positions,
    selectedWidgets,
    widgets,
    dataTree,
    shouldShowWidgetName,
  ): WidgetNameData[] | undefined => {
    // This way, we know that we're dragging so we'll clear the canvas, but keep existing references
    // Then, we can prevent a redraw until the widget positions change
    if (!shouldShowWidgetName) return [];
    // This way, we know that we're supposed to clear all the widget names
    // This would happen if there are no selected widgets and we need to clear the canvas
    if (!selectedWidgets || selectedWidgets.length === 0) return;

    const result: WidgetNameData[] = [];
    for (const selectedWidgetId of selectedWidgets) {
      const selectedWidget = widgets[selectedWidgetId];
      if (!selectedWidget) continue;
      result.push(getWidgetNameState(selectedWidget, dataTree, positions));
    }
    if (result.length > 0) return result;
    else return;
  },
);

/**
 * selector to get information regarding the focused widget to draw it's widget name on canvas
 */
export const getFocusedWidgetNameData = createSelector(
  getLayoutElementPositions,
  getFocusedWidget,
  getSelectedWidgets,
  getWidgets,
  getDataTree,
  getShouldShowWidgetName,
  (
    positions,
    focusedWidgetId,
    selectedWidgets,
    widgets,
    dataTree,
    shouldShowWidgetName,
  ): WidgetNameData | undefined => {
    if (!focusedWidgetId || !widgets || !shouldShowWidgetName) return;

    const focusedWidget = widgets[focusedWidgetId];

    if (!focusedWidget || selectedWidgets.indexOf(focusedWidgetId) > -1) return;

    return getWidgetNameState(focusedWidget, dataTree, positions, true);
  },
);
