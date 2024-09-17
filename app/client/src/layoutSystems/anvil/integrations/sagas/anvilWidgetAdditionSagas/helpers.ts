import type {
  FlattenedWidgetProps,
  WidgetBlueprint,
} from "WidgetProvider/constants";
import { getNextEntityName } from "utils/AppsmithUtils";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { getDataTree } from "selectors/dataTreeSelectors";
import WidgetFactory from "WidgetProvider/factory";
import { executeWidgetBlueprintOperations } from "sagas/WidgetBlueprintSagas";
import { call, put, select } from "redux-saga/effects";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { WidgetReduxActionTypes } from "ee/constants/ReduxActionConstants";

/**
 * In Anvil, we maintain some properties set by users on widgets.
 * When a similar or same widget is added to the Canvas, we retrieve these
 * properties and apply them.
 * This is to assist users by automatically apply settings based on context.

 * Retrieves the values from session storage for the widget properties
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetSessionValues: any = {};

  // in case we are dropping WDS_ICON_BUTTON_WIDGET, we want to reuse the values of BUTTON_WIDGET
  if (type === "WDS_ICON_BUTTON_WIDGET") {
    widgetType = "WDS_BUTTON_WIDGET";
  }

  for (const key in configMap) {
    let sessionStorageKey = `${widgetType}.${key}`;

    if (type === "ZONE_WIDGET") {
      sessionStorageKey = `${widgetType}.${parent.widgetId}.${key}`;
    }

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return widgetSessionValues;
}

export function* getUniqueWidgetName(prefix: string) {
  // The dataTree contains all entities (widgets, actions, etc).
  // We need to make sure that none of the entities have the same name
  // as the evaluations use the names of the entities as the unique identifier
  // for entities.
  const evalTree: DataTree = yield select(getDataTree);
  const entityNames = Object.keys(evalTree);

  // Get a new widget name that doesn't conflict with any existing entity names
  const widgetName = getNextEntityName(
    prefix, // The widget name prefix configured by the widget
    entityNames,
  );
  return widgetName;
}

/**
 * This generator function runs the blueprint operations configured in the new
 * widget being added.
 * @param widgets Canvas Widgets
 * @param widgetId Widget Id of the new widget being added
 * @param blueprint The configured operations to be run on the list of widgets
 * @returns An updated list of widgets
 */
export function* runBlueprintOperationsOnWidgets(
  widgets: CanvasWidgetsReduxState,
  widgetId: string,
  blueprint?: WidgetBlueprint,
) {
  if (!blueprint?.operations || blueprint.operations.length === 0) {
    return widgets;
  }
  // Some widgets need to run a few operations like modifying props or adding an action
  // these operations can be performed on the parent of the widget we're adding
  // therefore, we pass all widgets to executeWidgetBlueprintOperations
  // blueprint.operations contain the set of operations to perform to update the canvasWidgets
  // The blueprint operations configuration can be found in the default configurations of the widgets
  // Finalize the canvasWidgets with everything that needs to be updated
  const updatedWidgets: CanvasWidgetsReduxState = yield call(
    executeWidgetBlueprintOperations,
    blueprint.operations,
    widgets,
    widgetId,
  );
  return updatedWidgets;
}

/**
 * This function helps reference the new widget in the list of children
 * of the existing parent widget
 * @param widgets Canvas Widgets
 * @param parentId Parent into which the new widget is added
 * @param newChildWidgetId WidgetId of the new child widget
 * @returns An updated list of widgets
 */
export function addChildReferenceToParent(
  widgets: CanvasWidgetsReduxState,
  parentId: string,
  newChildWidgetId: string,
): CanvasWidgetsReduxState {
  const stateParent = widgets[parentId];
  // Update widgets to put back in the canvasWidgetsReducer
  const parent = {
    ...stateParent,
    children: [...(stateParent.children || []), newChildWidgetId],
  };

  widgets[parent.widgetId] = parent;
  return widgets;
}

/**
 * This helper generator function adds all properties to the new widget so that
 * it can be used in the application. The return value will eventually be stored
 * in the CanvasWidgetsReducer (normalised) and the servers (DSL - denormalised)
 * @param params The new widget's id, the parent whose child it is, and the type of the widget
 * @param widgets The list of widgets in which we will add the new widget
 * @returns An Object with the new list of widgets that also contains the new widget
 */
export function* updateWidgetListWithNewWidget(
  params: {
    parentId: string;
    type: string;
    widgetId: string;
  },
  widgets: CanvasWidgetsReduxState,
) {
  const { parentId, type, widgetId } = params;

  // Get default properties of the widget configured by the widget
  const widgetDefaultProperties = WidgetFactory.widgetDefaultPropertiesMap.get(
    type,
  ) as Record<string, unknown>;

  // Hydrate widget with properties based previously configured values of similar widgets
  const widgetSessionValues = getWidgetSessionValues(type, widgets[parentId]);

  // Get a unique name for the new widget
  const widgetName: string = yield getUniqueWidgetName(
    widgetDefaultProperties.widgetName as string,
  );

  const widget = {
    ...widgetDefaultProperties,
    parentId,
    widgetId,
    type,
    widgetName,
    version: widgetDefaultProperties.version,
    ...widgetSessionValues, // This is at the end of the spread to override
    blueprint: undefined, // This is usually non-serializable and needs to be removed
    rows: undefined,
    columns: undefined,
  };

  // Add the widget to the canvasWidgets (type: CanvasWidgetsReduxState)
  widgets[widget.widgetId] = widget;

  // Run blueprint operations an update the list of widgets
  let updatedWidgets: CanvasWidgetsReduxState =
    yield runBlueprintOperationsOnWidgets(
      widgets,
      widgetId,
      widgetDefaultProperties.blueprint as WidgetBlueprint | undefined,
    );

  // Reference new widget in the parent widget
  updatedWidgets = addChildReferenceToParent(
    updatedWidgets,
    parentId,
    widgetId,
  );

  return updatedWidgets;
}

/**
 * This is a general orchestrator generator function that calls the appropriate
 * operations to complete the addition of new widget into the list of widgets in
 * the system
 * @param stateWidgets The list of widgets from redux state
 * @param payload Payload of the redux action that will be used to create the new child widget
 * @returns An updated list of widgets
 */
export function* addNewAnvilWidgetToDSL(
  widgets: CanvasWidgetsReduxState,
  payload: {
    parentId: string;
    type: string;
    widgetId: string;
  },
) {
  const { type, widgetId } = payload;

  const updatedWidgets: CanvasWidgetsReduxState =
    yield updateWidgetListWithNewWidget(payload, widgets);

  // We need to have a separate helper which listens to specific redux actions
  // and updates the console accordingly. Doing it here doesn't seem right.
  // In this case we may listen to `WIDGET_CHILD_ADDED` action.
  // https://github.com/appsmithorg/appsmith/issues/35161
  AppsmithConsole.info({
    text: "Widget was created",
    source: {
      type: ENTITY_TYPE.WIDGET,
      id: widgetId,
      name: updatedWidgets[widgetId].widgetName,
    },
  });

  // This redux action seems useless, but it is possible that evaluations
  // uses this to trigger evaluations.
  yield put({
    type: WidgetReduxActionTypes.WIDGET_CHILD_ADDED,
    payload: {
      widgetId: widgetId,
      type: type,
    },
  });

  return updatedWidgets;
}
