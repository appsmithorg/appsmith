import { isNull } from "lodash";
import { GenericApiResponse } from "api/ApiResponses";
import DatasourcesApi, { Datasource } from "api/DatasourcesApi";
import { Plugin } from "api/PluginApi";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { AppState } from "reducers";
import { all, select, put, takeEvery, take } from "redux-saga/effects";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getPlugins } from "selectors/entitiesSelector";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getOnboardingState, setOnboardingState } from "utils/storage";
import { validateResponse } from "./ErrorSagas";
import { getSelectedWidget, getWidgetsMeta } from "./selectors";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import ActionAPI, { ActionCreateUpdateResponse } from "api/ActionAPI";
import {
  createOnboardingActionInit,
  createOnboardingActionSuccess,
} from "actions/onboardingActions";
import { changeDatasource } from "actions/datasourceActions";

const OnboardingConfig = [
  {
    step: 0,
    name: "Welcome",
    setup: () => {
      // To setup the state if any
      // Return action that needs to be dispatched
      return [
        {
          type: "SHOW_WELCOME",
        },
      ];
    },
    tooltip: {
      title: "",
      description: "",
      // May not be required. Tooltip is shown when we are in that onboarding step
      isVisible: (): boolean => {
        return false;
      },
    },
    // May not be required. This step is complete when the current step count
    // is greater than this step count.
    isComplete: (): boolean => {
      return false;
    },
  },
  {
    step: 1,
    name: "Example Database",
    setup: () => {
      return [
        {
          type: "CREATE_ONBOARDING_DBQUERY_INIT",
        },
        {
          type: "LISTEN_FOR_ADD_WIDGET",
        },
        {
          type: "LISTEN_FOR_TABLE_WIDGET_BINDING",
        },
      ];
    },
    tooltip: {
      title: "Say hello to your example database",
      description:
        "Go ahead, check it out. You can add the “+” icon to create a new query or connect to your own db.",
    },
  },
  {
    step: 2,
    name: "Add widget",
    setup: () => {
      return [];
    },
    tooltip: {
      title:
        "Wohoo! Your first widget. 🎉 Go ahead and connect this to a Query or API",
      description:
        "Copy the example binding below and paste inside TableData input",
      snippet: "{{exampleQuery.data}}",
    },
  },
  {
    step: 3,
    name: "Successful binding",
    setup: () => {
      // TODO: Should check whether the table widget's `tableData` prop
      // has a succesfull binding
      return [];
    },
    tooltip: {
      title: "This table is now connected to Example Query",
      description:
        "You can connect properties to variables on Appsmith with {{ }} bindings",
    },
  },
  {
    step: 4,
    name: "Deploy",
    setup: () => {
      // TODO: Listen for DEPLOY action.
      return [];
    },
    tooltip: {
      title: "You’re almost done! Just Hit Deploy",
      description:
        "Deploying your apps is a crucial step to building on appsmith.",
    },
  },
];

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

  return {};
};

function* listenForWidgetAdditions() {
  while (true) {
    yield take();
    const { payload } = yield take("WIDGET_ADD_CHILD");

    if (payload.type === "TABLE_WIDGET") {
      yield put({
        type: "SET_CURRENT_STEP",
        payload: 2,
      });
      yield put({
        type: "ADD_WIDGET_COMPLETE",
      });

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
      const widgetMeta = yield select(getWidgetsMeta);

      if (widgetMeta[selectedWidget.widgetId]) {
        const tableData = widgetMeta[selectedWidget.widgetId].filteredTableData;
        bindSuccessfull =
          bindSuccessfull && isDynamicValue(selectedWidget.tableData);
        bindSuccessfull = bindSuccessfull && Array.isArray(tableData);

        if (bindSuccessfull) {
          yield put({
            type: "SET_CURRENT_STEP",
            payload: 3,
          });

          return;
        }
      }
    }
  }
}

function* initiateOnboarding() {
  const currentOnboardingState = yield getOnboardingState();
  if (currentOnboardingState || isNull(currentOnboardingState)) {
    const set = yield setOnboardingState(true);

    if (set) {
      yield put({
        type: "SET_ONBOARDING_STATE",
        payload: true,
      });
      yield put({
        type: "NEXT_ONBOARDING_STEP",
      });
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
    const datasourceConfig = {
      pluginId: postgresPlugin.id,
      organizationId,
      datasourceConfiguration: {
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

    const currentPageId = yield select(getCurrentPageId);
    const actionPayload = {
      name: "ExampleQuery",
      pageId: currentPageId,
      datasource: {
        id: datasourceResponse.data.id,
      },
      actionConfiguration: {},
      eventData: {},
    };
    yield put(createOnboardingActionInit(actionPayload));
    const response: ActionCreateUpdateResponse = yield ActionAPI.createAPI(
      actionPayload,
    );

    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      const newAction = {
        ...response.data,
        datasource: datasourceResponse.data,
      };
      yield put(createOnboardingActionSuccess(newAction));
      yield put({
        type: ReduxActionTypes.CREATE_ONBOARDING_DBQUERY_SUCCESS,
      });

      yield put(changeDatasource(datasourceResponse.data));
    } else {
      yield put({
        type: ReduxActionErrorTypes.CREATE_ONBOARDING_ACTION_ERROR,
        payload: actionPayload,
      });
    }
  } catch (error) {
    yield put({
      type: "CREATE_ONBOARDING_DBQUERY_ERROR",
      payload: { error },
    });
  }
}

function* proceedOnboardingSaga() {
  const isinOnboarding = yield select(inOnboarding);

  if (isinOnboarding) {
    yield put({
      type: "INCREMENT_STEP",
    });

    yield setupOnboardingStep();
  }
}

function* setupOnboardingStep() {
  const currentStep = yield select(getCurrentStep);
  const currentConfig = OnboardingConfig[currentStep];
  let actions = currentConfig.setup();

  if (actions.length) {
    actions = actions.map(action => put(action));
    yield all(actions);
  }
}

function* skipOnboardingSaga() {
  const set = yield setOnboardingState(false);

  if (set) {
    yield put({
      type: "SET_ONBOARDING_STATE",
      payload: false,
    });
  }
}

export default function* onboardingSagas() {
  yield all([
    takeEvery(ReduxActionTypes.CREATE_APPLICATION_SUCCESS, initiateOnboarding),
    takeEvery("CREATE_ONBOARDING_DBQUERY_INIT", createOnboardingDatasource),
    takeEvery("NEXT_ONBOARDING_STEP", proceedOnboardingSaga),
    takeEvery("END_ONBOARDING", skipOnboardingSaga),
    takeEvery("LISTEN_FOR_ADD_WIDGET", listenForWidgetAdditions),
    takeEvery("LISTEN_FOR_TABLE_WIDGET_BINDING", listenForSuccessfullBinding),
    takeEvery("SET_CURRENT_STEP", setupOnboardingStep),
  ]);
}
