import type { ReduxAction } from "../actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import {
  all,
  call,
  delay,
  put,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  getFirstTimeUserOnboardingApplicationIds,
  getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown,
  removeAllFirstTimeUserOnboardingApplicationIds,
  removeFirstTimeUserOnboardingApplicationId,
  setEnableStartSignposting,
  setFirstTimeUserOnboardingApplicationId as storeFirstTimeUserOnboardingApplicationId,
  setFirstTimeUserOnboardingIntroModalVisibility as storeFirstTimeUserOnboardingIntroModalVisibility,
} from "utils/storage";

import { getCurrentUser } from "selectors/usersSelectors";
import history from "utils/history";

import { getSignpostingStepStateByStep } from "selectors/onboardingSelectors";
import {
  disableStartSignpostingAction,
  removeFirstTimeUserOnboardingApplicationId as removeFirstTimeUserOnboardingApplicationIdAction,
  setSignpostingOverlay,
  showSignpostingTooltip,
  signpostingStepUpdate,
} from "actions/onboardingActions";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { User } from "constants/userConstants";
import { builderURL } from "ee/RouteBuilder";
import type { SIGNPOSTING_STEP } from "pages/Editor/FirstTimeUserOnboarding/Utils";
import type { StepState } from "reducers/uiReducers/onBoardingReducer";
import { isUndefined } from "lodash";
import { isAirgapped } from "ee/utils/airgapHelpers";
import { SIGNPOSTING_ANALYTICS_STEP_NAME } from "pages/Editor/FirstTimeUserOnboarding/constants";

// Signposting sagas
function* setFirstTimeUserOnboardingApplicationId(action: ReduxAction<string>) {
  yield storeFirstTimeUserOnboardingApplicationId(action.payload);

  const applicationIds: string[] =
    yield getFirstTimeUserOnboardingApplicationIds();

  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
    payload: [...applicationIds, ...action.payload],
  });
}

function* removeFirstTimeUserOnboardingApplicationIdSaga(
  action: ReduxAction<string>,
) {
  yield call(removeFirstTimeUserOnboardingApplicationId, action.payload);

  const applicationIds: string[] =
    yield getFirstTimeUserOnboardingApplicationIds();

  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
    payload: applicationIds.filter((id) => id !== action.payload),
  });
}

function* setFirstTimeUserOnboardingIntroModalVisibility(
  action: ReduxAction<boolean>,
) {
  yield storeFirstTimeUserOnboardingIntroModalVisibility(action.payload);
}

function* endFirstTimeUserOnboardingSaga() {
  const firstTimeUserExperienceAppId: string = yield select(
    getCurrentApplicationId,
  );

  yield put(
    removeFirstTimeUserOnboardingApplicationIdAction(
      firstTimeUserExperienceAppId,
    ),
  );
}

function* firstTimeUserOnboardingInitSaga(
  action: ReduxAction<{
    applicationId: string;
    basePageId: string;
    suffix?: string;
  }>,
) {
  yield call(setEnableStartSignposting, true);
  yield put({
    type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    payload: action.payload.applicationId,
  });
  history.replace(
    builderURL({
      basePageId: action.payload.basePageId,
      suffix: action.payload.suffix || "",
    }),
  );

  const isEditorInitialised: boolean = yield select(getIsEditorInitialized);

  if (!isEditorInitialised) {
    yield take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS);
  }

  let showOverlay = true;

  // We don't want to show the signposting overlay when we intend to show the
  // telemetry callout
  const currentUser: User | undefined = yield select(getCurrentUser);

  if (currentUser?.isSuperUser && !isAirgapped()) {
    const isAnonymousDataPopupAlreadyOpen: unknown = yield call(
      getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown,
    );

    if (!isAnonymousDataPopupAlreadyOpen) {
      showOverlay = false;
    }
  }

  yield put(setSignpostingOverlay(showOverlay));
  // Show the modal once the editor is loaded. The delay is to grab user attention back once the editor
  yield delay(1000);
  yield put({
    type: ReduxActionTypes.SET_SHOW_FIRST_TIME_USER_ONBOARDING_MODAL,
    payload: true,
  });
  AnalyticsUtil.logEvent("SIGNPOSTING_MODAL_FIRST_TIME_OPEN");
}

function* setFirstTimeUserOnboardingCompleteSaga(action: ReduxAction<boolean>) {
  if (action.payload) {
    yield put(disableStartSignpostingAction());
  }
}

function* disableStartFirstTimeUserOnboardingSaga() {
  yield call(removeAllFirstTimeUserOnboardingApplicationIds);
  yield call(setEnableStartSignposting, false);
}

function* setSignpostingStepStateSaga(
  action: ReduxAction<{ step: SIGNPOSTING_STEP; completed: boolean }>,
) {
  const { completed, step } = action.payload;
  const stepState: StepState | undefined = yield select(
    getSignpostingStepStateByStep,
    step,
  );

  // No changes to update so we ignore
  if (stepState && stepState.completed === completed) return;

  const readProps = completed
    ? {
        read: false,
      }
    : {};

  yield put(
    signpostingStepUpdate({
      ...action.payload,
      ...readProps,
    }),
  );

  // Show tooltip when a step is completed
  if (!isUndefined(readProps.read) && !readProps.read) {
    // Show tooltip after a small delay to not be abrupt
    yield delay(1000);
    AnalyticsUtil.logEvent("SIGNPOSTING_STEP_COMPLETE", {
      step_name: SIGNPOSTING_ANALYTICS_STEP_NAME[step],
    });
    yield put(showSignpostingTooltip(true));
  }
}

export default function* onboardingActionSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
      setFirstTimeUserOnboardingApplicationId,
    ),
    takeLatest(
      ReduxActionTypes.REMOVE_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
      removeFirstTimeUserOnboardingApplicationIdSaga,
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
      ReduxActionTypes.FIRST_TIME_USER_ONBOARDING_INIT,
      firstTimeUserOnboardingInitSaga,
    ),
    takeLatest(
      ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_COMPLETE,
      setFirstTimeUserOnboardingCompleteSaga,
    ),
    takeLatest(
      ReduxActionTypes.DISABLE_START_SIGNPOSTING,
      disableStartFirstTimeUserOnboardingSaga,
    ),
    takeLatest(
      ReduxActionTypes.SIGNPOSTING_STEP_UPDATE_INIT,
      setSignpostingStepStateSaga,
    ),
  ]);
}
