import { takeLeading, all, put, select } from "redux-saga/effects";
import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import history from "utils/history";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import {
  setWidgetDynamicProperty,
  updateWidgetPropertyRequest,
} from "actions/controlActions";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import AnalyticsUtil from "utils/AnalyticsUtil";

import {
  SNIPING_NOT_SUPPORTED,
  SNIPING_SELECT_WIDGET_AGAIN,
} from "@appsmith/constants/messages";

import WidgetFactory from "utils/WidgetFactory";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { builderURL } from "RouteBuilder";

const WidgetTypes = WidgetFactory.widgetTypes;

export function* bindDataToWidgetSaga(
  action: ReduxAction<{
    widgetId: string;
  }>,
) {
  const pageId: string = yield select(getCurrentPageId);
  const currentURL = new URL(window.location.href);
  const searchParams = currentURL.searchParams;
  const queryId = searchParams.get("bindTo");
  const currentAction: ActionData | undefined = yield select((state) =>
    state.entities.actions.find(
      (action: ActionData) => action.config.id === queryId,
    ),
  );
  const widgetState: CanvasWidgetsReduxState = yield select(getCanvasWidgets);
  const selectedWidget = widgetState[action.payload.widgetId];

  if (!selectedWidget || !selectedWidget.type) {
    Toaster.show({
      text: SNIPING_SELECT_WIDGET_AGAIN(),
      variant: Variant.warning,
    });
    return;
  }
  const { widgetId } = action.payload;
  let propertyPath = "";
  let propertyValue: any = "";
  let isValidProperty = true;

  // Pranav has an Open PR for this file so just returning for now
  if (!currentAction) return;

  switch (selectedWidget.type) {
    case WidgetTypes.BUTTON_WIDGET:
    case WidgetTypes.FORM_BUTTON_WIDGET:
      propertyPath = "onClick";
      propertyValue = `{{${currentAction.config.name}.run()}}`;
      break;
    case WidgetTypes.CHECKBOX_WIDGET:
      propertyPath = "defaultCheckedState";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.DATE_PICKER_WIDGET2:
      propertyPath = "defaultDate";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.FILE_PICKER_WIDGET:
      propertyPath = "onFilesSelected";
      propertyValue = `{{${currentAction.config.name}.run()}}`;
      break;
    case WidgetTypes.IFRAME_WIDGET:
      propertyPath = "source";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.INPUT_WIDGET:
      propertyPath = "defaultText";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.INPUT_WIDGET_V2:
      propertyPath = "defaultText";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.LIST_WIDGET:
      propertyPath = "listData";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.MAP_WIDGET:
      propertyPath = "defaultMarkers";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.RADIO_GROUP_WIDGET:
      propertyPath = "options";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.RATE_WIDGET:
      propertyPath = "onRateChanged";
      propertyValue = `{{${currentAction.config.name}.run()}}`;
      break;
    case WidgetTypes.RICH_TEXT_EDITOR_WIDGET:
      propertyPath = "defaultText";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.DROP_DOWN_WIDGET:
      propertyPath = "options";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.SELECT_WIDGET:
      propertyPath = "options";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.SWITCH_WIDGET:
      propertyPath = "defaultSwitchState";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.TABLE_WIDGET:
      propertyPath = "tableData";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.TABLE_WIDGET_V2:
      propertyPath = "tableData";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.TEXT_WIDGET:
      propertyPath = "text";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.VIDEO_WIDGET:
      propertyPath = "url";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.JSON_FORM_WIDGET:
      propertyPath = "sourceData";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    default:
      isValidProperty = false;
      break;
  }
  AnalyticsUtil.logEvent("WIDGET_SELECTED_VIA_SNIPING_MODE", {
    widgetType: selectedWidget.type,
    actionName: currentAction.config.name,
    apiId: queryId,
    propertyPath,
    propertyValue,
  });
  if (queryId && isValidProperty) {
    // set the property path to dynamic, i.e. enable JS mode
    yield put(setWidgetDynamicProperty(widgetId, propertyPath, true));
    yield put(
      updateWidgetPropertyRequest(widgetId, propertyPath, propertyValue),
    );
    yield put({
      type: ReduxActionTypes.SHOW_PROPERTY_PANE,
      payload: {
        widgetId: widgetId,
        callForDragOrResize: undefined,
        force: true,
      },
    });
    history.replace(
      builderURL({
        pageId,
      }),
    );
  } else {
    queryId &&
      Toaster.show({
        text: SNIPING_NOT_SUPPORTED(),
        variant: Variant.warning,
      });
  }
}

function* resetSnipingModeSaga() {
  const currentURL = new URL(window.location.href);
  const searchParams = currentURL.searchParams;
  searchParams.delete("isSnipingMode");
  searchParams.delete("bindTo");
  history.replace({
    ...window.location,
    pathname: currentURL.pathname,
    search: searchParams.toString(),
  });
}

export default function* snipingModeSagas() {
  yield all([
    takeLeading(ReduxActionTypes.BIND_DATA_TO_WIDGET, bindDataToWidgetSaga),
    takeLeading(ReduxActionTypes.RESET_SNIPING_MODE, resetSnipingModeSaga),
  ]);
}
