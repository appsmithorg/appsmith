import {
  ReduxAction,
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "constants/ReduxActionConstants";
import { all, put, select, take, takeLatest } from "redux-saga/effects";
import {
  setEnableFirstTimeUserOnboarding as storeEnableFirstTimeUserOnboarding,
  setFirstTimeUserOnboardingApplicationId as storeFirstTimeUserOnboardingApplicationId,
  setFirstTimeUserOnboardingIntroModalVisibility as storeFirstTimeUserOnboardingIntroModalVisibility,
} from "utils/storage";
import { AppIconCollection } from "components/ads/AppIcon";

import { getAppCardColorPalette } from "selectors/themeSelectors";
import {
  getRandomPaletteColor,
  getNextEntityName,
  createNewQueryName,
} from "utils/AppsmithUtils";
import { getCurrentUser } from "selectors/usersSelectors";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";

import {
  getFirstTimeUserOnboardingApplicationId,
  getGuidedTourDatasource,
  getOnboardingOrganisations,
} from "selectors/onboardingSelectors";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { Organization } from "constants/orgConstants";
import { enableGuidedTour } from "actions/onboardingActions";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { WidgetProps } from "widgets/BaseWidget";
import { getNextWidgetName } from "./WidgetOperationUtils";
import WidgetFactory from "utils/WidgetFactory";
import { generateReactKey } from "utils/generators";
import { RenderModes } from "constants/WidgetConstants";
import log from "loglevel";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getWidgets } from "./selectors";
import { createActionRequest } from "actions/pluginActionActions";
import { Datasource } from "entities/Datasource";
import { Action } from "entities/Action";
import { getActions } from "selectors/entitiesSelector";

function* createApplication() {
  const colorPalette = yield select(getAppCardColorPalette);
  const color = getRandomPaletteColor(colorPalette);
  const icon =
    AppIconCollection[Math.floor(Math.random() * AppIconCollection.length)];

  const currentUser = yield select(getCurrentUser);
  const userOrgs: Organization[] = yield select(getOnboardingOrganisations);
  const currentOrganizationId = currentUser.currentOrganizationId;
  let organization;

  if (!currentOrganizationId) {
    organization = userOrgs[0];
  } else {
    const filteredOrganizations = userOrgs.filter(
      (org: any) => org.organization.id === currentOrganizationId,
    );
    organization = filteredOrganizations[0];
  }

  // Organization could be undefined for unknown reason
  if (organization) {
    const applicationList = organization.applications;

    const applicationName = getNextEntityName(
      "Customer Support app",
      applicationList.map((el: any) => el.name),
      true,
    );

    yield put({
      type: ReduxActionTypes.CREATE_APPLICATION_INIT,
      payload: {
        applicationName,
        orgId: organization.organization.id,
        icon,
        color,
      },
    });

    yield take(ReduxActionTypes.FETCH_PAGE_LIST_SUCCESS);
    let pageId = yield select(getCurrentPageId);

    if (!pageId) {
      yield take(ReduxActionTypes.SWITCH_CURRENT_PAGE_ID);
    }

    yield put(enableGuidedTour(true));

    pageId = yield select(getCurrentPageId);
    const applicationId = yield select(getCurrentApplicationId);

    history.push(
      BUILDER_PAGE_URL({
        applicationId,
        pageId,
      }),
    );
  }
}

function* createGuidedTourQuery() {
  const datasource: Datasource | undefined = yield select(
    getGuidedTourDatasource,
  );
  const actions = yield select(getActions);
  const pageId = yield select(getCurrentPageId);

  if (datasource) {
    const newQueryName = createNewQueryName(actions, pageId, {
      prefix: "getCustomers",
    });
    const payload: Partial<Action> = {
      name: newQueryName,
      pageId,
      eventData: {
        actionType: "Query",
        from: "Guided-Tour",
        dataSource: datasource.name,
      },
      pluginId: datasource.pluginId,
      actionConfiguration: {
        body:
          '/* ---> Edit the limit "100" with "10" and hit RUN */\n\nSELECT * FROM users LIMIT 100;',
      },
      datasource: {
        id: datasource.id,
      },
    };

    yield put(createActionRequest(payload));
    yield take(ReduxActionTypes.CREATE_ACTION_SUCCESS);

    yield put({
      type: "TOGGLE_LOADER",
      payload: false,
    });
  }
}

function* addOnboardingWidget(action: ReduxAction<Partial<WidgetProps>>) {
  const widgetConfig = action.payload;

  if (!widgetConfig.type) return;

  const defaultConfig = WidgetFactory.widgetConfigMap.get(widgetConfig.type);

  const evalTree = yield select(getDataTree);
  const widgets = yield select(getWidgets);

  const widgetName = getNextWidgetName(widgets, widgetConfig.type, evalTree, {
    prefix: widgetConfig.widgetName,
  });

  try {
    const newWidget = {
      newWidgetId: generateReactKey(),
      widgetId: "0",
      parentId: "0",
      renderMode: RenderModes.CANVAS,
      isLoading: false,
      ...defaultConfig,
      widgetName,
      ...widgetConfig,
    };

    yield put({
      type: WidgetReduxActionTypes.WIDGET_ADD_CHILD,
      payload: newWidget,
    });
  } catch (error) {
    log.error(error);
  }
}

// Signposting sagas
function* setEnableFirstTimeUserOnboarding(action: ReduxAction<boolean>) {
  yield storeEnableFirstTimeUserOnboarding(action.payload);
}

function* setFirstTimeUserOnboardingApplicationId(action: ReduxAction<string>) {
  yield storeFirstTimeUserOnboardingApplicationId(action.payload);
}

function* setFirstTimeUserOnboardingIntroModalVisibility(
  action: ReduxAction<boolean>,
) {
  yield storeFirstTimeUserOnboardingIntroModalVisibility(action.payload);
}

function* endFirstTimeUserOnboardingSaga() {
  const firstTimeUserExperienceAppId = yield select(
    getFirstTimeUserOnboardingApplicationId,
  );
  yield put({
    type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
    payload: false,
  });
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: "",
  });
  Toaster.show({
    text: "Skipped First time user experience",
    hideProgressBar: false,
    variant: Variant.success,
    dispatchableAction: {
      type: ReduxActionTypes.UNDO_END_FIRST_TIME_USER_ONBOARDING,
      payload: firstTimeUserExperienceAppId,
    },
  });
}

function* undoEndFirstTimeUserOnboardingSaga(action: ReduxAction<string>) {
  yield put({
    type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
    payload: true,
  });
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: action.payload,
  });
}

function* firstTimeUserOnboardingInitSaga(
  action: ReduxAction<{ applicationId: string; pageId: string }>,
) {
  yield put({
    type: ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
    payload: true,
  });
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: action.payload.applicationId,
  });
  yield put({
    type: ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
    payload: true,
  });
  history.replace(
    BUILDER_PAGE_URL({
      applicationId: action.payload.applicationId,
      pageId: action.payload.pageId,
    }),
  );
}

export default function* onboardingActionSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.ONBOARDING_CREATE_APPLICATION,
      createApplication,
    ),
    takeLatest("CREATE_GUIDED_TOUR_QUERY", createGuidedTourQuery),
    takeLatest(ReduxActionTypes.GUIDED_TOUR_ADD_WIDGET, addOnboardingWidget),
    takeLatest(
      ReduxActionTypes.SET_ENABLE_FIRST_TIME_USER_ONBOARDING,
      setEnableFirstTimeUserOnboarding,
    ),
    takeLatest(
      ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
      setFirstTimeUserOnboardingApplicationId,
    ),
    takeLatest(
      ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
      setFirstTimeUserOnboardingIntroModalVisibility,
    ),
    takeLatest(
      ReduxActionTypes.END_FIRST_TIME_USER_ONBOARDING,
      endFirstTimeUserOnboardingSaga,
    ),
    takeLatest(
      ReduxActionTypes.UNDO_END_FIRST_TIME_USER_ONBOARDING,
      undoEndFirstTimeUserOnboardingSaga,
    ),
    takeLatest(
      ReduxActionTypes.FIRST_TIME_USER_ONBOARDING_INIT,
      firstTimeUserOnboardingInitSaga,
    ),
  ]);
}
