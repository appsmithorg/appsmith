import { selectAllWidgets } from "actions/widgetActions";
import { OccupiedSpace } from "constants/editorConstants";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  CONTAINER_GRID_PADDING,
  MAIN_CONTAINER_WIDGET_ID,
  WIDGET_PADDING,
  GridDefaults,
} from "constants/WidgetConstants";
import { isEqual } from "lodash";
import { SelectedArenaDimensions } from "pages/common/CanvasSelectionArena";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { getSelectedWidgets } from "selectors/ui";
import { snapToGrid } from "utils/helpers";
import { areIntersecting } from "utils/WidgetPropsUtils";
import { WidgetProps } from "widgets/BaseWidget";
import { getWidget } from "./selectors";

function* selectAllWidgetsInArea(action: ReduxAction<any>) {
  const selectionArena: SelectedArenaDimensions = action.payload;
  const mainContainer: WidgetProps = yield select(
    getWidget,
    MAIN_CONTAINER_WIDGET_ID,
  );
  const padding = CONTAINER_GRID_PADDING + WIDGET_PADDING;
  const snapSpace = {
    snapColumnWidth:
      (mainContainer.rightColumn - 2 * padding) / mainContainer.snapColumns,
    snapColumnHeight: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  };
  const topLeftCorner = snapToGrid(
    snapSpace.snapColumnWidth,
    snapSpace.snapColumnHeight,
    selectionArena.left,
    selectionArena.top,
  );
  const bottomRightCorner = snapToGrid(
    snapSpace.snapColumnWidth,
    snapSpace.snapColumnHeight,
    selectionArena.left + selectionArena.width,
    selectionArena.top + selectionArena.height,
  );
  const widgetOccupiedSpaces:
    | {
        [containerWidgetId: string]: OccupiedSpace[];
      }
    | undefined = yield select(getOccupiedSpaces);
  if (widgetOccupiedSpaces) {
    const mainContainerWidgets = widgetOccupiedSpaces[MAIN_CONTAINER_WIDGET_ID];
    const widgets = Object.values(mainContainerWidgets || {});
    const widgetsToBeSelected = widgets.filter((eachWidget) => {
      const { bottom, left, right, top } = eachWidget;
      return areIntersecting(
        { bottom, left, right, top },
        {
          bottom: bottomRightCorner[1],
          right: bottomRightCorner[0],
          top: topLeftCorner[1],
          left: topLeftCorner[0],
        },
      );
    });
    const widgetIdsToSelect = widgetsToBeSelected.map((each) => each.id);
    const currentSelectedWidgets: string[] = yield select(getSelectedWidgets);
    if (!isEqual(widgetIdsToSelect, currentSelectedWidgets)) {
      yield put(selectAllWidgets(widgetIdsToSelect));
    }
  }
}

export default function* canvasSagas() {
  yield all([
    takeLatest(ReduxActionTypes.SELECT_WIDGETS_IN_AREA, selectAllWidgetsInArea),
  ]);
}
