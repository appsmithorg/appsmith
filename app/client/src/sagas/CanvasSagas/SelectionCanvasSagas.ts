import { selectMultipleWidgetsAction } from "actions/widgetSelectionActions";
import { OccupiedSpace } from "constants/CanvasEditorConstants";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { isEqual } from "lodash";
import { SelectedArenaDimensions } from "pages/common/CanvasArenas/CanvasSelectionArena";
import { Task } from "redux-saga";
import { all, cancel, put, select, take, takeLatest } from "redux-saga/effects";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { getSelectedWidgets } from "selectors/ui";
import { snapToGrid } from "utils/helpers";
import { areIntersecting } from "utils/WidgetPropsUtils";
import { WidgetProps } from "widgets/BaseWidget";
import { getWidgets } from "sagas/selectors";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";

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
    snapSpaces,
    snapToNextColumn,
    snapToNextRow,
  }: {
    selectionArena: SelectedArenaDimensions;
    snapToNextColumn: boolean;
    snapToNextRow: boolean;
    isMultiSelect: boolean;
    snapSpaces: {
      snapColumnSpace: number;
      snapRowSpace: number;
    };
  } = action.payload;
  const { snapColumnSpace, snapRowSpace } = snapSpaces;
  // we use snapToNextRow, snapToNextColumn to determine if the selection rectangle is inverted
  // so to snap not to the next column or row like we usually do,
  // but to snap it to the one before it coz the rectangle is inverted.
  const topLeftCorner = snapToGrid(
    snapColumnSpace,
    snapRowSpace,
    selectionArena.left - (snapToNextRow ? snapColumnSpace : 0),
    selectionArena.top - (snapToNextColumn ? snapRowSpace : 0),
  );
  const bottomRightCorner = snapToGrid(
    snapColumnSpace,
    snapRowSpace,
    selectionArena.left + selectionArena.width,
    selectionArena.top + selectionArena.height,
  );

  if (widgetOccupiedSpaces && mainContainer) {
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
  const widgetId = actionPayload.payload.widgetId || MAIN_CONTAINER_WIDGET_ID;
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const mainContainer: WidgetProps = canvasWidgets[widgetId];

  //filter out the parent container and keep only the widgets that are on `widgetId`'s canvas
  const lastSelectedWidgetsWithoutParent = lastSelectedWidgets.filter(
    (each) =>
      mainContainer &&
      each !== mainContainer.parentId &&
      canvasWidgets[each] &&
      canvasWidgets[each].parentId === widgetId,
  );

  const widgetOccupiedSpaces:
    | {
        [containerWidgetId: string]: OccupiedSpace[];
      }
    | undefined = yield select(getOccupiedSpaces);
  const selectionTask: Task = yield takeLatest(
    ReduxActionTypes.SELECT_WIDGETS_IN_AREA,
    selectAllWidgetsInAreaSaga,
    {
      lastSelectedWidgets: lastSelectedWidgetsWithoutParent,
      mainContainer,
      widgetOccupiedSpaces,
    },
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
    takeLatest(
      ReduxActionTypes.START_CANVAS_SELECTION_FROM_EDITOR,
      startCanvasSelectionSaga,
    ),
  ]);
}
