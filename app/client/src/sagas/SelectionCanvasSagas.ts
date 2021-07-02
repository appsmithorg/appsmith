import { selectMultipleWidgetsAction } from "actions/widgetSelectionActions";
import { OccupiedSpace } from "constants/editorConstants";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  CONTAINER_GRID_PADDING,
  WIDGET_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
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

interface StartingSelectionState {
  lastSelectedWidgets: string[];
  mainContainer: WidgetProps;
  widgetOccupiedSpaces:
    | {
        [containerWidgetId: string]: OccupiedSpace[];
      }
    | undefined;
}
function* selectAllWidgetsInAreaSaga(
  StartingSelectionState: StartingSelectionState,
  action: ReduxAction<any>,
) {
  const {
    lastSelectedWidgets,
    mainContainer,
    widgetOccupiedSpaces,
  } = StartingSelectionState;
  const {
    isMultiSelect,
    selectionArena,
    snapToNextColumn,
    snapToNextRow,
  }: {
    selectionArena: SelectedArenaDimensions;
    snapToNextColumn: boolean;
    snapToNextRow: boolean;
    isMultiSelect: boolean;
  } = action.payload;

  let padding = (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2;
  if (
    mainContainer.widgetId === MAIN_CONTAINER_WIDGET_ID ||
    mainContainer.type === "CONTAINER_WIDGET"
  ) {
    //For MainContainer and any Container Widget padding doesn't exist coz there is already container padding.
    padding = CONTAINER_GRID_PADDING * 2;
  }
  if (mainContainer.noPad) {
    // Widgets like ListWidget choose to have no container padding so will only have widget padding
    padding = WIDGET_PADDING * 2;
  }
  // const padding = CONTAINER_GRID_PADDING + WIDGET_PADDING;
  const snapSpace = {
    snapColumnWidth:
      (mainContainer.rightColumn - padding) / GridDefaults.DEFAULT_GRID_COLUMNS,
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

  if (widgetOccupiedSpaces) {
    const mainContainerWidgets = widgetOccupiedSpaces[mainContainer.widgetId];
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
    const filteredLastSelectedWidgets = isMultiSelect
      ? lastSelectedWidgets.filter((each) => !widgetIdsToSelect.includes(each))
      : lastSelectedWidgets;
    const filteredWidgetsToSelect = isMultiSelect
      ? [
          ...filteredLastSelectedWidgets,
          ...widgetIdsToSelect.filter(
            (each) => !lastSelectedWidgets.includes(each),
          ),
        ]
      : widgetIdsToSelect;
    const currentSelectedWidgets: string[] = yield select(getSelectedWidgets);

    if (!isEqual(filteredWidgetsToSelect, currentSelectedWidgets)) {
      yield put(selectMultipleWidgetsAction(filteredWidgetsToSelect));
    }
  }
}

function* startCanvasSelectionSaga(
  actionPayload: ReduxAction<{ widgetId: string }>,
) {
  const lastSelectedWidgets: string[] = yield select(getSelectedWidgets);
  const mainContainer: WidgetProps = yield select(
    getWidget,
    actionPayload.payload.widgetId,
  );
  const widgetOccupiedSpaces:
    | {
        [containerWidgetId: string]: OccupiedSpace[];
      }
    | undefined = yield select(getOccupiedSpaces);
  const selectionTask = yield takeLatest(
    ReduxActionTypes.SELECT_WIDGETS_IN_AREA,
    selectAllWidgetsInAreaSaga,
    { lastSelectedWidgets, mainContainer, widgetOccupiedSpaces },
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
