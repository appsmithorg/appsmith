/**
 * ModuleInterfaceSagas
 *
 * Purpose:
 * This saga file serves as a bridge between the Community Edition (CE) and Enterprise Edition (EE)
 * module-related functionalities. It provides a clean interface layer that handles all interactions
 * between core widget operations and module-specific features available in the enterprise version.
 */
import type { WidgetAddChild } from "actions/pageActions";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { Saga } from "redux-saga";

export interface HandleModuleWidgetCreationSagaPayload {
  addChildPayload: WidgetAddChild;
  widgets: CanvasWidgetsReduxState;
}

export function* handleModuleWidgetCreationSaga(
  props: HandleModuleWidgetCreationSagaPayload,
) {
  return props.widgets;
}

export function* waitForPackageInitialization(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  saga: Saga,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action: ReduxAction<unknown>,
) {}
