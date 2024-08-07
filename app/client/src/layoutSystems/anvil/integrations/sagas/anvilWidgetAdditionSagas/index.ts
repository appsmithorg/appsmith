import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type { AnvilNewWidgetsPayload } from "../../actions/actionTypes";
import { AnvilReduxActionTypes } from "../../actions/actionTypes";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type {
  AnvilHighlightInfo,
  WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import {
  ReduxActionErrorTypes,
  type ReduxAction,
} from "ee/constants/ReduxActionConstants";
import type { WidgetProps } from "widgets/BaseWidget";
import { WDS_V2_WIDGET_MAP } from "widgets/wds/constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { getMainCanvasLastRowHighlight } from "../anvilDraggingSagas/helpers";
import { updateAndSaveAnvilLayout } from "layoutSystems/anvil/utils/anvilChecksUtils";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getWidgets } from "sagas/selectors";
import {
  addDetachedWidgetToMainCanvas,
  addWidgetsToMainCanvasLayout,
} from "layoutSystems/anvil/utils/layouts/update/mainCanvasLayoutUtils";
import { addWidgetsToSection } from "layoutSystems/anvil/utils/layouts/update/sectionUtils";
import log from "loglevel";
import { generateDefaultLayoutPreset } from "layoutSystems/anvil/layoutComponents/presets/DefaultLayoutPreset";
import { addWidgetsToPreset } from "layoutSystems/anvil/utils/layouts/update/additionUtils";
import { addNewAnvilWidgetToDSL } from "./helpers";

// The suggested widget functionality allows users to bind data from the Query pane
// to a new or existing widget on the Canvas.
// This saga handles the necessary logic to add an the suggested widget to an Anvil canvas
function* addSuggestedWidgetToDSL(
  actionPayload: ReduxAction<{
    newWidget: {
      newWidgetId: string;
      type: string;
      props: WidgetProps;
      detachFromLayout: boolean;
    };
  }>,
) {
  try {
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
      const updatedWidgets: CanvasWidgetsReduxState =
        yield getUpdatedListOfWidgetsAfterAddingNewWidget(
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
  } catch (e) {
    log.debug("Error adding suggested widget to Anvil Canvas: ", e);
  }
}

// function to add a new child widget to the DSL
export function* getUpdatedListOfWidgetsAfterAddingNewWidget(
  highlight: AnvilHighlightInfo, // Highlight information for the drop zone
  newWidget: {
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

  // Creating a shallow copy of the widgets from redux state
  // as these will be mutated in the course of the operation
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };

  const draggedWidgets: WidgetLayoutProps[] = [
    {
      alignment,
      widgetId: newWidget.newWidgetId,
      widgetType: newWidget.type,
    },
  ];

  // Follow the operations necessary for detached widgets like Modal Widget
  if (newWidget.detachFromLayout) {
    updatedWidgets = yield call(addDetachedWidgetToMainCanvas, updatedWidgets, {
      widgetId: newWidget.newWidgetId,
      type: newWidget.type,
    });
  } else {
    // Handle different scenarios based on the drop zone type (main canvas, section, or generic layout)
    // If the widget is dropped in the main canvas or into a detached widget like the Modal Widget
    if (isMainCanvas || parentWidgetWithLayout.detachFromLayout) {
      updatedWidgets = yield call(
        addWidgetsToMainCanvasLayout,
        updatedWidgets,
        draggedWidgets,
        highlight,
      );
    } else if (isSection) {
      const res: { canvasWidgets: CanvasWidgetsReduxState } = yield call(
        addWidgetsToSection,
        updatedWidgets,
        draggedWidgets,
        highlight,
        updatedWidgets[canvasId],
      );
      updatedWidgets = res.canvasWidgets;
    } else {
      // The typical operation when adding widgets to a zone
      updatedWidgets = yield addWidgetToGenericLayout(
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
export function* addWidgetsSaga(
  actionPayload: ReduxAction<AnvilNewWidgetsPayload>,
) {
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
      getUpdatedListOfWidgetsAfterAddingNewWidget,
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
    newWidgetId: string;
    type: string;
  },
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  const canvasWidget = updatedWidgets[highlight.canvasId];
  const canvasLayout = canvasWidget.layout
    ? canvasWidget.layout
    : generateDefaultLayoutPreset();

  const newWidgetContext = {
    widgetId: newWidget.newWidgetId,
    type: newWidget.type,
    parentId: canvasWidget.widgetId,
  };

  /**
   * Create widget and add to parent.
   */
  updatedWidgets = yield addNewAnvilWidgetToDSL(
    updatedWidgets,
    newWidgetContext,
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
    },
  };
}

export default function* anvilWidgetAdditionSagas() {
  yield all([
    takeLatest(AnvilReduxActionTypes.ANVIL_ADD_NEW_WIDGET, addWidgetsSaga),
    takeLatest(
      AnvilReduxActionTypes.ANVIL_ADD_SUGGESTED_WIDGET,
      addSuggestedWidgetToDSL,
    ),
  ]);
}
