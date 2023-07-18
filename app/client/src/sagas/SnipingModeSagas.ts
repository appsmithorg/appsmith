import { all, call, put, select, takeLeading } from "redux-saga/effects";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { snipingModeBindToSelector } from "selectors/editorSelectors";
import type { ActionData } from "reducers/entityReducers/actionsReducer";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import {
  batchUpdateWidgetProperty,
  setWidgetDynamicProperty,
} from "actions/controlActions";
import AnalyticsUtil from "utils/AnalyticsUtil";

import {
  SNIPING_NOT_SUPPORTED,
  SNIPING_SELECT_WIDGET_AGAIN,
} from "@appsmith/constants/messages";

import WidgetFactory from "utils/WidgetFactory";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { setSnipingMode } from "actions/propertyPaneActions";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { toast } from "design-system";
import {
  AB_TESTING_EVENT_KEYS,
  FEATURE_FLAG,
} from "@appsmith/entities/FeatureFlag";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";
import type { SnipingModeConfig } from "widgets/constants";

export function* bindDataToWidgetSaga(
  action: ReduxAction<{
    widgetId: string;
  }>,
) {
  const queryId: string = yield select(snipingModeBindToSelector);
  const currentAction: ActionData | undefined = yield select((state) =>
    state.entities.actions.find(
      (action: ActionData) => action.config.id === queryId,
    ),
  );
  const widgetState: CanvasWidgetsReduxState = yield select(getCanvasWidgets);
  const isDSBindingEnabled: boolean = yield select(
    selectFeatureFlagCheck,
    FEATURE_FLAG.ab_ds_binding_enabled,
  );
  const selectedWidget = widgetState[action.payload.widgetId];

  if (!selectedWidget || !selectedWidget.type) {
    toast.show(SNIPING_SELECT_WIDGET_AGAIN(), {
      kind: "warning",
    });
    return;
  }
  const { widgetId } = action.payload;

  let isValidProperty = true;

  // Pranav has an Open PR for this file so just returning for now
  if (!currentAction) return;

  const { getSnipingModeConfig } = WidgetFactory.getWidgetMethods(
    selectedWidget.type,
  );

  let updatesMap = {};
  let updates: SnipingModeConfig = [];

  if (!getSnipingModeConfig) {
    isValidProperty = false;
  } else {
    updates = getSnipingModeConfig?.({
      data: `{{${currentAction.config.name}.data}}`,
      run: `{{${currentAction.config.name}.run()}}`,
    });

    AnalyticsUtil.logEvent("WIDGET_SELECTED_VIA_SNIPING_MODE", {
      widgetType: selectedWidget.type,
      actionName: currentAction.config.name,
      apiId: queryId,
      propertyPath: updates.map((update) => update.propertyPath),
      propertyValue: updates.map((update) => update.propertyValue),
      [AB_TESTING_EVENT_KEYS.abTestingFlagLabel]:
        FEATURE_FLAG.ab_ds_binding_enabled,
      [AB_TESTING_EVENT_KEYS.abTestingFlagValue]: isDSBindingEnabled,
    });

    updatesMap = updates?.reduce((acc: Record<string, string>, update) => {
      acc[update.propertyPath] = update.propertyValue;
      return acc;
    }, {});
  }

  if (queryId && isValidProperty && updates.length > 0) {
    // set the property path to dynamic, i.e. enable JS mode
    yield all(
      updates.map((update) => {
        const isDynamic = update.isDynamic ?? true;
        if (isDynamic) {
          return put(
            setWidgetDynamicProperty(widgetId, update.propertyPath, true),
          );
        }
      }),
    );
    yield put(batchUpdateWidgetProperty(widgetId, { modify: updatesMap }));
    yield call(resetSnipingModeSaga);
    yield put(selectWidgetInitAction(SelectionRequestType.One, [widgetId]));
  } else {
    queryId &&
      toast.show(SNIPING_NOT_SUPPORTED(), {
        kind: "warning",
      });
  }
}

function* resetSnipingModeSaga() {
  yield put(
    setSnipingMode({
      isActive: false,
      bindTo: undefined,
    }),
  );
}

export default function* snipingModeSagas() {
  yield all([
    takeLeading(ReduxActionTypes.BIND_DATA_TO_WIDGET, bindDataToWidgetSaga),
    takeLeading(ReduxActionTypes.RESET_SNIPING_MODE, resetSnipingModeSaga),
  ]);
}
