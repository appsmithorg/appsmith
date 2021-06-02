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
import { all, cancel, put, select, take, takeLatest } from "redux-saga/effects";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { getSelectedWidgets } from "selectors/ui";
import { snapToGrid } from "utils/helpers";
import { areIntersecting } from "utils/WidgetPropsUtils";
import { WidgetProps } from "widgets/BaseWidget";
import { getWidget } from "./selectors";

function* selectAllWidgetsInAreaSaga(action: ReduxAction<any>) {
  const {
    selectionArena,
    snapToNextColumn,
    snapToNextRow,
  }: {
    selectionArena: SelectedArenaDimensions;
    snapToNextColumn: boolean;
    snapToNextRow: boolean;
  } = action.payload;
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
  // we use snapToNextRow, snapToNextColumn to determine if the selection rectangle is inverted
  // so to snap not to the next column or row like we usually do,
  // but to snap it to the one before it coz the rectangle is inverted.
  const topLeftCorner = snapToGrid(
    snapSpace.snapColumnWidth,
    snapSpace.snapColumnHeight,
    selectionArena.left - (snapToNextRow ? snapSpace.snapColumnWidth : 0),
    selectionArena.top - (snapToNextColumn ? snapSpace.snapColumnHeight : 0),
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

function* startCanvasSelectionSaga() {
  const selectionTask = yield takeLatest(
    ReduxActionTypes.SELECT_WIDGETS_IN_AREA,
    selectAllWidgetsInAreaSaga,
  );
  yield take(ReduxActionTypes.STOP_CANVAS_SELECTION);
  yield cancel(selectionTask);
}

export default function* selectionCanvasSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.START_CANVAS_SELECTION,
      startCanvasSelectionSaga,
    ),
  ]);
}
