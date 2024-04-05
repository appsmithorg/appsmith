import {
  type ReduxAction,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import log from "loglevel";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type {
  AnvilHighlightInfo,
  WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { getWidget, getWidgets } from "sagas/selectors";
import { addWidgetsToPreset } from "../../utils/layouts/update/additionUtils";
import type {
  AnvilMoveWidgetsPayload,
  AnvilNewWidgetsPayload,
} from "../actions/actionTypes";
import { AnvilReduxActionTypes } from "../actions/actionTypes";
import { generateDefaultLayoutPreset } from "layoutSystems/anvil/layoutComponents/presets/DefaultLayoutPreset";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  addDetachedWidgetToMainCanvas,
  addWidgetsToMainCanvasLayout,
  moveWidgetsToMainCanvas,
} from "layoutSystems/anvil/utils/layouts/update/mainCanvasLayoutUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import {
  addWidgetsToSection,
  moveWidgetsToSection,
} from "layoutSystems/anvil/utils/layouts/update/sectionUtils";
import { WDS_V2_WIDGET_MAP } from "widgets/wds/constants";
import {
  addNewWidgetToDsl,
  getCreateWidgetPayload,
} from "layoutSystems/anvil/utils/widgetAdditionUtils";
import { updateAndSaveAnvilLayout } from "../../utils/anvilChecksUtils";
import { moveWidgetsToZone } from "layoutSystems/anvil/utils/layouts/update/zoneUtils";

// Function to retrieve highlighting information for the last row in the main canvas layout
export function* getMainCanvasLastRowHighlight() {
  // Retrieve the main canvas widget
  const mainCanvas: WidgetProps = yield select(
    getWidget,
    MAIN_CONTAINER_WIDGET_ID,
  );

  // Extract the layout ID and row index for the last row in the main canvas
  const layoutId: string = mainCanvas.layout[0].layoutId;
  const layoutOrder = [layoutId];
  const rowIndex = mainCanvas.layout[0].layout.length;

  // Return the highlighting information for the last row in the main canvas
  return {
    canvasId: MAIN_CONTAINER_WIDGET_ID,
    layoutOrder,
    rowIndex,
    posX: 0,
    posY: 0,
    alignment: FlexLayerAlignment.Start,
    dropZone: {},
    height: 0,
    width: 0,
    isVertical: false,
  };
}

// function to handle adding suggested widgets to the Anvil canvas
function* addSuggestedWidgetsAnvilSaga(
  actionPayload: ReduxAction<{
    newWidget: {
      newWidgetId: string;
      type: string;
      rows?: number;
      columns?: number;
      props: WidgetProps;
      detachFromLayout: boolean;
    };
  }>,
) {
  const { newWidget } = actionPayload.payload;

  // Find the corresponding WDS entry for the given widget type
  const wdsEntry = Object.entries(WDS_V2_WIDGET_MAP).find(
    ([legacyType]) => legacyType === newWidget.type,
  );

  // If a matching WDS entry is found, proceed with adding the suggested widget
  if (wdsEntry) {
    // Extract the WDS type for the suggested widget
    const [, wdsType] = wdsEntry;

    // Define parameters for the new widget based on the WDS type and provided dimensions
    const newWidgetParams = {
      width: (newWidget.rows || 0 / GridDefaults.DEFAULT_GRID_COLUMNS) * 100,
      height: newWidget.columns || 0 * GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      newWidgetId: newWidget.newWidgetId,
      parentId: MAIN_CONTAINER_WIDGET_ID,
      type: wdsType,
      detachFromLayout: newWidget.detachFromLayout,
    };

    // Get highlighting information for the last row in the main canvas
    const mainCanvasHighLight: AnvilHighlightInfo = yield call(
      getMainCanvasLastRowHighlight,
    );

    // Add the new widget to the DSL
    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      addNewChildToDSL,
      mainCanvasHighLight,
      newWidgetParams,
      true,
      false,
    );

    // Update the widget properties with the properties provided in the action payload
    updatedWidgets[newWidgetParams.newWidgetId] = {
      ...updatedWidgets[newWidgetParams.newWidgetId],
      ...newWidget.props,
    };

    // Save the updated Anvil layout
    yield call(updateAndSaveAnvilLayout, updatedWidgets);

    // Select the added widget
    yield put(
      selectWidgetInitAction(SelectionRequestType.One, [
        newWidgetParams.newWidgetId,
      ]),
    );
  }
}

// function to add a new child widget to the DSL
export function* addNewChildToDSL(
  highlight: AnvilHighlightInfo, // Highlight information for the drop zone
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
    detachFromLayout: boolean;
  },
  isMainCanvas: boolean, // Indicates if the drop zone is the main canvas
  isSection: boolean, // Indicates if the drop zone is a section
) {
  const { alignment, canvasId } = highlight;
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  const parentWidgetWithLayout = allWidgets[canvasId];
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

  const draggedWidgets: WidgetLayoutProps[] = [
    {
      alignment,
      widgetId: newWidget.newWidgetId,
      widgetType: newWidget.type,
    },
  ];

  if (newWidget.detachFromLayout) {
    updatedWidgets = yield call(addDetachedWidgetToMainCanvas, updatedWidgets, {
      widgetId: newWidget.newWidgetId,
      type: newWidget.type,
    });
  } else {
    // Handle different scenarios based on the drop zone type (main canvas, section, or generic layout)
    if (!!isMainCanvas || parentWidgetWithLayout.detachFromLayout) {
      updatedWidgets = yield call(
        addWidgetsToMainCanvasLayout,
        updatedWidgets,
        draggedWidgets,
        highlight,
      );
    } else if (!!isSection) {
      const res: { canvasWidgets: CanvasWidgetsReduxState } = yield call(
        addWidgetsToSection,
        updatedWidgets,
        draggedWidgets,
        highlight,
        updatedWidgets[canvasId],
      );
      updatedWidgets = res.canvasWidgets;
    } else {
      updatedWidgets = yield call(
        addWidgetToGenericLayout,
        updatedWidgets,
        draggedWidgets,
        highlight,
        newWidget,
      );
    }
  }
  return updatedWidgets;
}

// function to handle the addition of new widgets to the Anvil layout
function* addWidgetsSaga(actionPayload: ReduxAction<AnvilNewWidgetsPayload>) {
  try {
    const start = performance.now();

    const {
      dragMeta: { draggedOn },
      highlight,
      newWidget,
    } = actionPayload.payload;
    // Check if the drop zone is the main canvas
    const isMainCanvas = draggedOn === "MAIN_CANVAS";
    // Check if the drop zone is a section
    const isSection = draggedOn === "SECTION";

    // Call the addNewChildToDSL saga to perform the actual addition of the new widget to the DSL
    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      addNewChildToDSL,
      highlight,
      newWidget,
      !!isMainCanvas,
      !!isSection,
    );

    // Save the updated Anvil layout
    yield call(updateAndSaveAnvilLayout, updatedWidgets);

    // Select the newly added widget
    yield put(
      selectWidgetInitAction(SelectionRequestType.Create, [
        newWidget.newWidgetId,
      ]),
    );

    log.debug("Anvil: add new widget took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET,
        error,
      },
    });
  }
}

function* addWidgetToGenericLayout(
  allWidgets: CanvasWidgetsReduxState,
  draggedWidgets: WidgetLayoutProps[],
  highlight: AnvilHighlightInfo,
  newWidget: {
    width: number;
    height: number;
    newWidgetId: string;
    type: string;
  },
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  const canvasWidget = updatedWidgets[highlight.canvasId];
  const canvasLayout = canvasWidget.layout
    ? canvasWidget.layout
    : generateDefaultLayoutPreset();

  /**
   * Create widget and add to parent.
   */
  updatedWidgets = yield call(
    addNewWidgetToDsl,
    updatedWidgets,
    getCreateWidgetPayload(
      newWidget.newWidgetId,
      newWidget.type,
      canvasWidget.widgetId,
    ),
  );
  /**
   * Also add it to parent's layout.
   */
  return {
    ...updatedWidgets,
    [canvasWidget.widgetId]: {
      ...updatedWidgets[canvasWidget.widgetId],
      layout: addWidgetsToPreset(canvasLayout, highlight, draggedWidgets),
    },
    [newWidget.newWidgetId]: {
      ...updatedWidgets[newWidget.newWidgetId],
      // This is a temp fix, widget dimensions will be self computed by widgets
      height: newWidget.height,
      width: newWidget.width,
    },
  };
}

/**
 * Remove widgets from current parents and layouts.
 * Add to new parent and layout.
 */
function* moveWidgetsSaga(actionPayload: ReduxAction<AnvilMoveWidgetsPayload>) {
  try {
    const start = performance.now();
    const {
      dragMeta: { draggedOn },
      highlight,
      movedWidgets,
    } = actionPayload.payload;
    const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
    const parentWidgetWithLayout = allWidgets[highlight.canvasId];
    const isMainCanvas =
      draggedOn === "MAIN_CANVAS" || !!parentWidgetWithLayout.detachFromLayout;
    const isSection = draggedOn === "SECTION";
    const movedWidgetIds = movedWidgets.map((each) => each.widgetId);

    const updatedWidgets: CanvasWidgetsReduxState = yield call<
      typeof handleWidgetMovement
    >(
      handleWidgetMovement,
      allWidgets,
      movedWidgetIds,
      highlight,
      isMainCanvas,
      isSection,
    );

    yield call(updateAndSaveAnvilLayout, updatedWidgets);
    log.debug("Anvil : moving widgets took", performance.now() - start, "ms");
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.WIDGET_OPERATION_ERROR,
      payload: {
        action: AnvilReduxActionTypes.ANVIL_MOVE_WIDGET,
        error,
      },
    });
  }
}

export function* handleWidgetMovement(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgetIds: string[],
  highlight: AnvilHighlightInfo,
  isMainCanvas: boolean,
  isSection: boolean,
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  if (isMainCanvas) {
    /**
     * * Widgets are dropped on to Main Canvas.
     */
    updatedWidgets = yield call(
      moveWidgetsToMainCanvas,
      allWidgets,
      movedWidgetIds,
      highlight,
    );
  } else if (isSection) {
    /**
     * Widget are dropped into a Section.
     */
    updatedWidgets = yield call(
      moveWidgetsToSection,
      allWidgets,
      movedWidgetIds,
      highlight,
    );
  } else {
    updatedWidgets = yield call(
      moveWidgetsToZone,
      allWidgets,
      movedWidgetIds,
      highlight,
    );
  }

  return updatedWidgets;
}

export default function* anvilDraggingSagas() {
  yield all([
    takeLatest(AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET, addWidgetsSaga),
    takeLatest(AnvilReduxActionTypes.ANVIL_MOVE_WIDGET, moveWidgetsSaga),
    takeLatest(
      AnvilReduxActionTypes.ANVIL_ADD_SUGGESTED_WIDGET,
      addSuggestedWidgetsAnvilSaga,
    ),
  ]);
}
