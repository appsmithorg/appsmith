import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { GridDefaults } from "constants/WidgetConstants";
import { groupBy } from "lodash";
import log from "loglevel";
import { AutoHeightLayoutTreeReduxState } from "reducers/entityReducers/autoHeightReducers/autoHeightLayoutTreeReducer";
import { CanvasLevelsReduxState } from "reducers/entityReducers/autoHeightReducers/canvasLevelsReducer";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { call, put, select } from "redux-saga/effects";
import { shouldWidgetsCollapse } from "./helpers";
import { getWidgets } from "sagas/selectors";
import { getCanvasHeightOffset } from "selectors/editorSelectors";
import {
  getAutoHeightLayoutTree,
  getCanvasLevelMap,
} from "selectors/autoHeightSelectors";
import { FlattenedWidgetProps } from "widgets/constants";
import {
  getWidgetMaxAutoHeight,
  getWidgetMinAutoHeight,
  isAutoHeightEnabledForWidget,
} from "widgets/WidgetUtils";
import { getChildOfContainerLikeWidget } from "./helpers";

export function* dynamicallyUpdateContainersSaga() {
  const start = performance.now();

  const stateWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const canvasWidgets: FlattenedWidgetProps[] | undefined = Object.values(
    stateWidgets,
  ).filter((widget: FlattenedWidgetProps) => widget.type === "CANVAS_WIDGET");
  const canvasLevelMap: CanvasLevelsReduxState = yield select(
    getCanvasLevelMap,
  );

  const dynamicHeightLayoutTree: AutoHeightLayoutTreeReduxState = yield select(
    getAutoHeightLayoutTree,
  );

  const groupedByCanvasLevel = groupBy(
    canvasWidgets,
    (widget) => canvasLevelMap[widget.widgetId],
  );

  const levels = Object.keys(groupedByCanvasLevel)
    .map((level) => parseInt(level, 10))
    .sort((a, b) => b - a);

  const updates: Record<string, number> = {};
  const shouldCollapse: boolean = yield call(shouldWidgetsCollapse);

  for (const level of levels) {
    const canvasWidgetsAtThisLevel = groupedByCanvasLevel[`${level}`];
    for (const canvasWidget of canvasWidgetsAtThisLevel) {
      if (canvasWidget.parentId) {
        const parentContainerWidget = stateWidgets[canvasWidget.parentId];

        let bottomRow, topRow, originalBottomRow, originalTopRow;
        if (dynamicHeightLayoutTree[parentContainerWidget.widgetId]) {
          const layoutNode =
            dynamicHeightLayoutTree[parentContainerWidget.widgetId];
          bottomRow = layoutNode.bottomRow;
          topRow = layoutNode.topRow;
          originalBottomRow = layoutNode.originalBottomRow;
          originalTopRow = layoutNode.originalTopRow;
        } else {
          bottomRow = parentContainerWidget.bottomRow;
          topRow = parentContainerWidget.topRow;
        }
        if (isAutoHeightEnabledForWidget(parentContainerWidget)) {
          const childWidgetId:
            | string
            | undefined = yield getChildOfContainerLikeWidget(
            parentContainerWidget,
          );
          if (childWidgetId !== canvasWidget.widgetId) continue;

          let maxBottomRow = bottomRow - topRow;
          if (
            parentContainerWidget.detachFromLayout &&
            parentContainerWidget.height
          ) {
            topRow = 0;
            bottomRow = Math.ceil(
              parentContainerWidget.height /
                GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
            );

            maxBottomRow = bottomRow;
          }

          let canvasBottomRow = canvasWidget.bottomRow;

          if (
            Array.isArray(canvasWidget.children) &&
            canvasWidget.children.length > 0
          ) {
            maxBottomRow = canvasWidget.children
              .filter((widgetId) => !stateWidgets[widgetId].detachFromLayout)
              .reduce((prev: number, next: string) => {
                if (dynamicHeightLayoutTree[next].bottomRow > prev)
                  return dynamicHeightLayoutTree[next].bottomRow;
                return prev;
              }, 0);
            maxBottomRow += GridDefaults.CANVAS_EXTENSION_OFFSET;
            canvasBottomRow = maxBottomRow + 0;

            // For widgets like Tabs Widget, some of the height is occupied by the
            // tabs themselves, the child canvas as a result has less number of rows available
            // To accommodate for this, we need to increase the new height by the offset amount.
            const canvasHeightOffset: number = getCanvasHeightOffset(
              parentContainerWidget.type,
              parentContainerWidget,
            );

            maxBottomRow += canvasHeightOffset;
          } else if (
            !shouldCollapse &&
            topRow === bottomRow &&
            originalBottomRow !== undefined &&
            originalTopRow !== undefined
          ) {
            maxBottomRow = originalBottomRow - originalTopRow;
          }

          // Get the boundaries for possible min and max dynamic height.
          const minDynamicHeightInRows = getWidgetMinAutoHeight(
            parentContainerWidget,
          );
          const maxDynamicHeightInRows = getWidgetMaxAutoHeight(
            parentContainerWidget,
          );

          // If the new height is below the min threshold
          if (maxBottomRow < minDynamicHeightInRows) {
            maxBottomRow = minDynamicHeightInRows;
          }
          // If the new height is above the max threshold
          if (maxBottomRow > maxDynamicHeightInRows) {
            maxBottomRow = maxDynamicHeightInRows;
          }

          if (
            maxBottomRow !== bottomRow - topRow ||
            canvasBottomRow !== canvasWidget.bottomRow
          ) {
            if (!updates.hasOwnProperty(parentContainerWidget.widgetId)) {
              updates[parentContainerWidget.widgetId] =
                maxBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
            }
          }
        }
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    // TODO(abhinav): Make sure there are no race conditions or scenarios where these updates are not considered.
    for (const widgetId in updates) {
      yield put({
        type: ReduxActionTypes.UPDATE_WIDGET_AUTO_HEIGHT,
        payload: {
          widgetId,
          height: updates[widgetId],
        },
      });
    }
  }
  log.debug(
    "Dynamic height: Container computations took:",
    performance.now() - start,
    "ms",
  );
}
