import { GenericApiResponse } from "api/ApiResponses";
import DatasourcesApi, { Datasource } from "api/DatasourcesApi";
import { Plugin } from "api/PluginApi";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import { all, delay, put, select, take, takeEvery } from "redux-saga/effects";
import { getDatasources, getPlugins } from "selectors/entitiesSelector";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getOnboardingState, setOnboardingState } from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { getSelectedWidget } from "./selectors";
import {
  setCurrentStep,
  setOnboardingState as setOnboardingReduxState,
  showTooltip,
} from "actions/onboardingActions";
import {
  changeDatasource,
  expandDatasourceEntity,
} from "actions/datasourceActions";
import { playOnboardingAnimation } from "utils/helpers";
import {
  OnboardingConfig,
  OnboardingStep,
} from "constants/OnboardingConstants";
import AnalyticsUtil from "../utils/AnalyticsUtil";

export const getCurrentStep = (state: AppState) =>
  state.ui.onBoarding.currentStep;
export const inOnboarding = (state: AppState) =>
  state.ui.onBoarding.inOnboarding;
export const isAddWidgetComplete = (state: AppState) =>
  state.ui.onBoarding.addedWidget;
export const getTooltipConfig = (state: AppState) => {
  const currentStep = getCurrentStep(state);
  if (currentStep >= 0) {
    return OnboardingConfig[currentStep].tooltip;
  }

  return OnboardingConfig[OnboardingStep.NONE].tooltip;
};
export const showCompletionDialog = (state: AppState) => {
  const isInOnboarding = inOnboarding(state);
  const currentStep = getCurrentStep(state);

  return isInOnboarding && currentStep === OnboardingStep.DEPLOY;
};

function* listenForWidgetAdditions() {
  while (true) {
    yield take();
    const { payload } = yield take("WIDGET_ADD_CHILD");

    if (payload.type === "TABLE_WIDGET") {
      yield put(setCurrentStep(OnboardingStep.ADD_WIDGET));
      yield put({
        type: ReduxActionTypes.ADD_WIDGET_COMPLETE,
      });
      yield put(showTooltip(OnboardingStep.ADD_WIDGET));

      return;
    }
  }
}

function* listenForSuccessfullBinding() {
  while (true) {
    yield take();

    let bindSuccessfull = true;
    const selectedWidget = yield select(getSelectedWidget);
    if (selectedWidget && selectedWidget.type === "TABLE_WIDGET") {
      const dataTree = yield select(getDataTree);

      if (dataTree[selectedWidget.widgetName]) {
        const widgetProperties = dataTree[selectedWidget.widgetName];
        const dynamicBindingPathList =
          dataTree[selectedWidget.widgetName].dynamicBindingPathList;
        const hasBinding = !!dynamicBindingPathList.length;

        if (hasBinding) {
          yield put(showTooltip(OnboardingStep.NONE));
        }

        bindSuccessfull = bindSuccessfull && hasBinding;

        if (widgetProperties.invalidProps) {
          bindSuccessfull =
            bindSuccessfull && !("tableData" in widgetProperties.invalidProps);
        }

        if (bindSuccessfull) {
          yield put(setCurrentStep(OnboardingStep.SUCCESSFUL_BINDING));

          // Show tooltip now
          yield put(showTooltip(OnboardingStep.SUCCESSFUL_BINDING));
          yield delay(1000);
          playOnboardingAnimation();

          return;
        }
      }
    }
  }
}

function* createOnboardingDatasource() {
  try {
    const organizationId = yield select(getCurrentOrgId);
    const plugins = yield select(getPlugins);
    const postgresPlugin = plugins.find(
      (plugin: Plugin) => plugin.name === "PostgreSQL",
    );
    const datasources: Datasource[] = yield select(getDatasources);
    let onboardingDatasource = datasources.find(
      datasource => datasource.name === "ExampleDatabase",
    );

    if (!onboardingDatasource) {
      const datasourceConfig: any = {
        pluginId: postgresPlugin.id,
        name: "ExampleDatabase",
        organizationId,
        datasourceConfiguration: {
          connection: {
            mode: "READ_WRITE",
          },
          endpoints: [
            {
              host: "fake-api.cvuydmurdlas.us-east-1.rds.amazonaws.com",
              port: 5432,
            },
          ],
          authentication: {
            databaseName: "fakeapi",
            username: "fakeapi",
            password: "LimitedAccess123#",
          },
        },
      };

      const datasourceResponse: GenericApiResponse<Datasource> = yield DatasourcesApi.createDatasource(
        datasourceConfig,
      );
      yield validateResponse(datasourceResponse);
      yield put({
        type: ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
        payload: datasourceResponse.data,
      });

      onboardingDatasource = datasourceResponse.data;
    }

    yield put(expandDatasourceEntity(onboardingDatasource.id));

    yield put({
      type: ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_SUCCESS,
    });

    // Navigate to that datasource page
    yield put(changeDatasource(onboardingDatasource));
    yield put(showTooltip(OnboardingStep.EXAMPLE_DATABASE));

    // Need to hide this tooltip based on some events
    yield take([ReduxActionTypes.QUERY_PANE_CHANGE]);
    yield put(showTooltip(OnboardingStep.NONE));
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_ONBOARDING_DBQUERY_ERROR,
      payload: { error },
    });
  }
}

function* listenForWidgetUnselection() {
  while (true) {
    yield take();

    yield take(ReduxActionTypes.HIDE_PROPERTY_PANE);
    const currentStep = yield select(getCurrentStep);
    const isinOnboarding = yield select(inOnboarding);

    if (!isinOnboarding || currentStep !== OnboardingStep.SUCCESSFUL_BINDING)
      return;

    yield put(setCurrentStep(OnboardingStep.DEPLOY));

    yield delay(1000);
    yield put(showTooltip(OnboardingStep.DEPLOY));
    return;
  }
}

function* listenForDeploySaga() {
  while (true) {
    yield take();

    yield take(ReduxActionTypes.PUBLISH_APPLICATION_SUCCESS);
    yield put(showTooltip(OnboardingStep.NONE));
    yield put({
      type: ReduxActionTypes.SHOW_ONBOARDING_COMPLETION_DIALOG,
      payload: true,
    });
    yield put(setOnboardingReduxState(false));

    return;
  }
}

function* initiateOnboarding() {
  const currentOnboardingState = yield getOnboardingState();
  AnalyticsUtil.logEvent("ONBOARDING_WELCOME");
  if (currentOnboardingState) {
    yield put(setOnboardingReduxState(true));
    yield put({
      type: ReduxActionTypes.NEXT_ONBOARDING_STEP,
    });
  }
}

function* proceedOnboardingSaga() {
  const isInOnboarding = yield select(inOnboarding);

  if (isInOnboarding) {
    yield put({
      type: ReduxActionTypes.INCREMENT_STEP,
    });

    yield setupOnboardingStep();
  }
}

function* setupOnboardingStep() {
  const currentStep: OnboardingStep = yield select(getCurrentStep);
  const currentConfig = OnboardingConfig[currentStep];
  if (currentConfig.eventName) {
    AnalyticsUtil.logEvent(currentConfig.eventName);
  }
  let actions = currentConfig.setup();

  if (actions.length) {
    actions = actions.map(action => put(action));
    yield all(actions);
  }
}

function* skipOnboardingSaga() {
  AnalyticsUtil.logEvent("END_ONBOARDING");
  const set = yield setOnboardingState(false);

  if (set) {
    yield put(setOnboardingReduxState(false));
  }
}

export default function* onboardingSagas() {
  yield all([
    takeEvery(ReduxActionTypes.CREATE_APPLICATION_SUCCESS, initiateOnboarding),
    takeEvery(
      ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_INIT,
      createOnboardingDatasource,
    ),
    takeEvery(ReduxActionTypes.NEXT_ONBOARDING_STEP, proceedOnboardingSaga),
    takeEvery(ReduxActionTypes.END_ONBOARDING, skipOnboardingSaga),
    takeEvery(ReduxActionTypes.LISTEN_FOR_ADD_WIDGET, listenForWidgetAdditions),
    takeEvery(
      ReduxActionTypes.LISTEN_FOR_TABLE_WIDGET_BINDING,
      listenForSuccessfullBinding,
    ),
    takeEvery(
      ReduxActionTypes.LISTEN_FOR_WIDGET_UNSELECTION,
      listenForWidgetUnselection,
    ),
    takeEvery(ReduxActionTypes.SET_CURRENT_STEP, setupOnboardingStep),
    takeEvery(ReduxActionTypes.LISTEN_FOR_DEPLOY, listenForDeploySaga),
  ]);
}
