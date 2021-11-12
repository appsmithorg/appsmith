import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { all, put, select, take, takeLatest } from "redux-saga/effects";
import {
  setEnableFirstTimeUserOnboarding as storeEnableFirstTimeUserOnboarding,
  setFirstTimeUserOnboardingApplicationId as storeFirstTimeUserOnboardingApplicationId,
  setFirstTimeUserOnboardingIntroModalVisibility as storeFirstTimeUserOnboardingIntroModalVisibility,
} from "utils/storage";
import { AppIconCollection } from "components/ads/AppIcon";

import { getAppCardColorPalette } from "selectors/themeSelectors";
import { getRandomPaletteColor, getNextEntityName } from "utils/AppsmithUtils";
import { getCurrentUser } from "selectors/usersSelectors";
import { BUILDER_PAGE_URL } from "constants/routes";
import history from "utils/history";

import {
  getFirstTimeUserOnboardingApplicationId,
  getOnboardingOrganisations,
} from "selectors/onboardingSelectors";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { Organization } from "constants/orgConstants";
import { enableGuidedTour } from "actions/onboardingActions";

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

    yield take(ReduxActionTypes.CREATE_APPLICATION_SUCCESS);
    yield put(enableGuidedTour(true));
  }
}

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
