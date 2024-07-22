import {
  type ReduxAction,
  ReduxActionErrorTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import log from "loglevel";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select, takeLatest } from "redux-saga/effects";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
  WidgetLayoutProps,
} from "layoutSystems/anvil/utils/anvilTypes";
import { getWidget, getWidgets } from "sagas/selectors";
import { addWidgetsToPreset } from "../../../utils/layouts/update/additionUtils";
import type {
  AnvilMoveWidgetsPayload,
  AnvilNewWidgetsPayload,
} from "../../actions/actionTypes";
import { AnvilReduxActionTypes } from "../../actions/actionTypes";
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
import { updateAndSaveAnvilLayout } from "../../../utils/anvilChecksUtils";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "@appsmith/entities/AppsmithConsole/utils";
import WidgetFactory from "WidgetProvider/factory";
import { getDataTree } from "selectors/dataTreeSelectors";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { getNextEntityName } from "utils/AppsmithUtils";
import type { WidgetBlueprint } from "WidgetProvider/constants";
import { executeWidgetBlueprintOperations } from "sagas/WidgetBlueprintSagas";
import {
  isRedundantZoneWidget,
  isZoneWidget,
  moveWidgetsToZone,
} from "layoutSystems/anvil/utils/layouts/update/zoneUtils";
import { severTiesFromParents } from "../../../utils/layouts/update/moveUtils";
import { widgetChildren } from "../../../utils/layouts/widgetUtils";

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

/**
 * retrieves the values from session storage for the widget properties
 * for hydration of the widget when we create widget on drop
 */
export function getWidgetSessionValues(
  type: string,
  parent: FlattenedWidgetProps,
) {
  // For WDS_INLINE_BUTTONS_WIDGET, we want to hydation only to work when we add more items to the inline button group.
  // So we don't want to hydrate the values when we drop the widget on the canvas.
  if (["WDS_INLINE_BUTTONS_WIDGET"].includes(type)) return;

  let widgetType = type;
  const configMap = WidgetFactory.widgetConfigMap.get(type);

  const widgetSessionValues: any = {};

  // in case we are dropping WDS_ICON_BUTTON_WIDGET, we want to reuse the values of BUTTON_WIDGET
  if (type === "WDS_ICON_BUTTON_WIDGET") {
    widgetType = "WDS_BUTTON_WIDGET";
  }

  for (const key in configMap) {
    if (configMap[key] != undefined) {
      let sessionStorageKey = `${widgetType}.${key}`;

      if (type === "ZONE_WIDGET") {
        sessionStorageKey = `${widgetType}.${parent.widgetId}.${key}`;
      }

      let valueFromSession: any = sessionStorage.getItem(sessionStorageKey);

      // parse "true" as true and "false" as false
      if (valueFromSession === "true") {
        valueFromSession = true;
      } else if (valueFromSession === "false") {
        valueFromSession = false;
      }

      if (valueFromSession !== undefined && valueFromSession !== null) {
        widgetSessionValues[key] = valueFromSession;
      }
    }
  }

  return widgetSessionValues;
}

function* generateChildWidgets(
  params: {
    parentId: string;
    type: string;
    widgetId: string;
  },
  widgets: { [widgetId: string]: FlattenedWidgetProps },
) {
  const { parentId, type, widgetId } = params;
  // Get default properties of the widget configured by the widget
  // Exclude blueprint property

  const widgetDefaultProperties = WidgetFactory.widgetDefaultPropertiesMap.get(
    type,
  ) as Record<string, unknown>;

  // Hydrate widget with properties based previously configured values of similar widgets
  const widgetSessionValues = getWidgetSessionValues(type, widgets[parentId]);

  /* WIERD MODAL WIDGET HANDLING. */
  // TODO: handle this using widget blueprint instead of this abstraction leak
  // const detachedWidgets: string[] = yield select(
  //   getCurrentlyOpenAnvilDetachedWidgets,
  // );

  // Abstraction leak!!!
  // const isModalOpen = detachedWidgets && detachedWidgets.length > 0;
  // in case we are creating zone inside zone, we want to use the parent's column space, we want
  // to make sure the elevateBackground is set to false
  // if (type === "ZONE_WIDGET" && isModalOpen) {
  //   props = { ...props, elevatedBackground: false };
  // }

  /* EO WIERD MODAL WIDGET HANDLING */

  /* HANDLE GENERATION OF NEW NAME FOR WIDGET */
  const evalTree: DataTree = yield select(getDataTree);
  const entityNames = Object.keys(evalTree);

  const widgetName = getNextEntityName(
    widgetDefaultProperties.widgetName as string,
    [...entityNames],
  );
  /* EO HANDLE GENERATION OF NEW NAME FOR WIDGET */

  // Combine all properties into one object to return
  const widget = {
    ...widgetDefaultProperties,
    parentId,
    widgetId,
    type,
    widgetName,
    version: widgetDefaultProperties.version,
    ...widgetSessionValues,
  };

  widget.blueprint = undefined;
  // Add the widget to the canvasWidgets
  // We need this in here as widgets will be used to get the current widget
  widgets[widget.widgetId] = widget;

  const blueprint = {
    ...(widgetDefaultProperties.blueprint as WidgetBlueprint | undefined),
  };
  // Some widgets need to run a few operations like modifying props or adding an action
  // these operations can be performed on the parent of the widget we're adding
  // therefore, we pass all widgets to executeWidgetBlueprintOperations
  // blueprint.operations contain the set of operations to perform to update the canvasWidgets
  if (blueprint && blueprint.operations && blueprint.operations.length > 0) {
    // Finalize the canvasWidgets with everything that needs to be updated
    widgets = yield call(
      executeWidgetBlueprintOperations,
      blueprint.operations,
      widgets,
      widget.widgetId,
    );
  }

  return { widgetId: widget.widgetId, updatedWidgets: widgets };
}

export function* addNewAnvilWidgetToDSL(
  updatedStateWidgets: CanvasWidgetsReduxState,
  payload: {
    parentId: string;
    type: string;
    widgetId: string;
  },
) {
  const { parentId, type } = payload;

  const widgets = Object.assign({}, updatedStateWidgets);
  // Get the current parent widget whose child will be the new widget.
  const stateParent: FlattenedWidgetProps = updatedStateWidgets[parentId];

  // Generate the full WidgetProps of the widget to be added.
  const { updatedWidgets, widgetId } = yield generateChildWidgets(
    payload,
    widgets,
  );

  // Update widgets to put back in the canvasWidgetsReducer
  const parent = {
    ...stateParent,
    children: [...(stateParent.children || []), widgetId],
  };

  widgets[parent.widgetId] = parent;
  AppsmithConsole.info({
    text: "Widget was created",
    source: {
      type: ENTITY_TYPE.WIDGET,
      id: widgetId,
      name: updatedWidgets[widgetId].widgetName,
    },
  });
  yield put({
    type: WidgetReduxActionTypes.WIDGET_CHILD_ADDED,
    payload: {
      widgetId: widgetId,
      type: type,
    },
  });

  return widgets;
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

/**
 * Remove widgets from current parents and layouts.
 * Add to new parent and layout.
 */
export function* moveWidgetsSaga(
  actionPayload: ReduxAction<AnvilMoveWidgetsPayload>,
) {
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

    let updatedWidgets: CanvasWidgetsReduxState = yield call<
      typeof handleWidgetMovement
    >(
      handleWidgetMovement,
      allWidgets,
      movedWidgetIds,
      highlight,
      isMainCanvas,
      isSection,
    );

    updatedWidgets = handleDeleteRedundantZones(updatedWidgets, movedWidgets);

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

export function handleDeleteRedundantZones(
  allWidgets: CanvasWidgetsReduxState,
  movedWidgets: DraggedWidget[],
) {
  let updatedWidgets: CanvasWidgetsReduxState = { ...allWidgets };
  const parentIds = movedWidgets
    .map((widget) => widget.parentId)
    .filter(Boolean) as string[];

  for (const parentId of parentIds) {
    const zone = updatedWidgets[parentId];

    if (!isZoneWidget(zone) || !zone.parentId) continue;

    const parentSection = updatedWidgets[zone.parentId];

    if (!parentSection || !isRedundantZoneWidget(zone, parentSection)) continue;

    updatedWidgets = severTiesFromParents(updatedWidgets, [zone.widgetId]);
    delete updatedWidgets[zone.widgetId];

    if (widgetChildren(parentSection).length === 1) {
      updatedWidgets = severTiesFromParents(updatedWidgets, [zone.parentId]);
      delete updatedWidgets[zone.parentId];
    }
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
