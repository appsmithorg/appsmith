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
  SNIPING_NOT_SUPPORTED,
  SNIPING_SELECT_WIDGET_AGAIN,
} from "../constants/messages";

import log from "loglevel";
import {
  WIDGET_TO_SNIPPABLE_PROPERTY_MAP,
  getPropertyValueFromType,
} from "./SnipingModeUtils";

export function* bindDataToWidgetSaga(
  action: ReduxAction<{
    widgetId: string;
  }>,
) {
  const applicationId = yield select(getCurrentApplicationId);
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
  try {
    const { widgetId } = action.payload;

    const widgetProps = WIDGET_TO_SNIPPABLE_PROPERTY_MAP[selectedWidget.type];
    if (!widgetProps) {
      queryId &&
        Toaster.show({
          text: SNIPING_NOT_SUPPORTED(),
          variant: Variant.warning,
        });
    }

    const propertyPath = widgetProps.property;
    const {
      errorMessage,
      isJsMode,
      isValid,
      propertyValue,
    } = getPropertyValueFromType(widgetProps, currentAction, selectedWidget);

    AnalyticsUtil.logEvent("WIDGET_SELECTED_VIA_SNIPING_MODE", {
      widgetType: selectedWidget.type,
      actionName: currentAction.config.name,
      apiId: queryId,
      propertyPath,
      propertyValue,
    });
    if (queryId && isValid && propertyValue) {
      // set the property path to dynamic, i.e. enable JS mode
      if (isJsMode)
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
  } catch (e) {
    log.error(e);
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
