import { all, put, select, takeLeading } from "redux-saga/effects";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import history from "../utils/history";
import { BUILDER_PAGE_URL } from "../constants/routes";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "../selectors/editorSelectors";
import { ActionData } from "../reducers/entityReducers/actionsReducer";
import { getCanvasWidgets } from "../selectors/entitiesSelector";
import {
  setWidgetDynamicProperty,
  updateWidgetPropertyRequest,
} from "../actions/controlActions";
import { Toaster } from "../components/ads/Toast";
import { Variant } from "../components/ads/common";
import AnalyticsUtil from "../utils/AnalyticsUtil";

import {
  SNIPING_FOR_CHART_FAILED,
  SNIPING_NOT_SUPPORTED,
  SNIPING_SELECT_WIDGET_AGAIN,
} from "../constants/messages";

import WidgetFactory from "utils/WidgetFactory";

const WidgetTypes = WidgetFactory.widgetTypes;

export function* bindDataToWidgetSaga(
  action: ReduxAction<{
    widgetId: string;
  }>,
) {
  const pageId = yield select(getCurrentPageId);
  // console.log("Binding Data in Saga");
  const currentURL = new URL(window.location.href);
  const searchParams = currentURL.searchParams;
  const queryId = searchParams.get("bindTo");
  const currentAction = yield select((state) =>
    state.entities.actions.find(
      (action: ActionData) => action.config.id === queryId,
    ),
  );
  const selectedWidget = (yield select(getCanvasWidgets))[
    action.payload.widgetId
  ];

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
  let isSetJsMode = true;
  let errorMessage;

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
    case WidgetTypes.LIST_WIDGET:
      propertyPath = "items";
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
    case WidgetTypes.SWITCH_WIDGET:
      propertyPath = "defaultSwitchState";
      propertyValue = `{{${currentAction.config.name}.data}}`;
      break;
    case WidgetTypes.TABLE_WIDGET:
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
    case WidgetTypes.CHART_WIDGET:
      isSetJsMode = false;
      propertyPath = "chartData";
      const suggestedQuery = currentAction?.data?.suggestedWidgets?.find(
        (eachWidget: any) => eachWidget.type === WidgetTypes.CHART_WIDGET,
      )?.bindingQuery;
      isValidProperty = !!suggestedQuery;
      if (!isValidProperty) {
        errorMessage = SNIPING_FOR_CHART_FAILED();
      } else {
        const primarySequenceKey = Object.keys(selectedWidget.chartData)[0];
        propertyValue = {
          [primarySequenceKey]: {
            data: `{{${currentAction.config.name}.${suggestedQuery}}}`,
            seriesName: "Demo",
          },
        };
      }
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
    if (isSetJsMode)
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
    const applicationId = yield select(getCurrentApplicationId);
    history.replace(
      BUILDER_PAGE_URL({
        applicationId,
        pageId,
      }),
    );
  } else {
    queryId &&
      Toaster.show({
        text: errorMessage || SNIPING_NOT_SUPPORTED(),
        variant: errorMessage ? Variant.danger : Variant.warning,
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
