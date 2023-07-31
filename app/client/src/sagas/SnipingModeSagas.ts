import { all, call, put, select, takeLeading } from "redux-saga/effects";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { snipingModeBindToSelector } from "selectors/editorSelectors";
import type { ActionData } from "reducers/entityReducers/actionsReducer";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import {
  batchUpdateWidgetDynamicProperty,
  batchUpdateWidgetProperty,
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
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import type { PropertyUpdates } from "widgets/constants";

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

  const { getSnipingModeUpdates } = WidgetFactory.getWidgetMethods(
    selectedWidget.type,
  );

  let updates: Array<PropertyUpdates> = [];

  if (getSnipingModeUpdates) {
    updates = getSnipingModeUpdates?.({
      data: `{{${currentAction.config.name}.data}}`,
      run: `{{${currentAction.config.name}.run()}}`,
    });

    AnalyticsUtil.logEvent("WIDGET_SELECTED_VIA_SNIPING_MODE", {
      widgetType: selectedWidget.type,
      actionName: currentAction.config.name,
      apiId: queryId,
      propertyPath: updates?.map((update) => update.propertyPath).toString(),
      propertyValue: updates?.map((update) => update.propertyPath).toString(),
      [AB_TESTING_EVENT_KEYS.abTestingFlagLabel]:
        FEATURE_WALKTHROUGH_KEYS.ab_ds_binding_enabled,
      [AB_TESTING_EVENT_KEYS.abTestingFlagValue]: isDSBindingEnabled,
    });
  } else {
    isValidProperty = false;
  }

  if (queryId && isValidProperty && updates.length > 0) {
    const updatesMap: Record<string, string> = updates?.reduce(
      (acc: Record<string, string>, update) => {
        acc[update.propertyPath] = update.propertyValue as string;
        return acc;
      },
      {},
    );

    const batchUpdateArray = updates.map((update) => {
      return {
        propertyPath: update.propertyPath,
        isDynamic: !!update.isDynamicPropertyPath,
        skipValidation: true, // Since we are coming up with the dynamic string, we can skip validation
      };
    });

    // set the property path to dynamic, i.e. enable JS mode
    yield put(batchUpdateWidgetDynamicProperty(widgetId, batchUpdateArray));
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
