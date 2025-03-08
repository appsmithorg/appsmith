/**
 * ModuleInterfaceSagas
 *
 * Purpose:
 * This saga file serves as a bridge between the Community Edition (CE) and Enterprise Edition (EE)
 * module-related functionalities. It provides a clean interface layer that handles all interactions
 * between core widget operations and module-specific features available in the enterprise version.
 */
import type { WidgetAddChild } from "actions/pageActions";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";

export interface HandleModuleWidgetCreationSagaPayload {
  addChildPayload: WidgetAddChild;
  widgets: CanvasWidgetsReduxState;
}

export function* handleModuleWidgetCreationSaga(
  props: HandleModuleWidgetCreationSagaPayload,
) {
  return props.widgets;
}
