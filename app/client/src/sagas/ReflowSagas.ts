import {
  setEnableReflowAction,
  updateReflowOnBoardingAction,
} from "actions/reflowActions";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReflowReduxActionTypes,
} from "constants/ReduxActionConstants";
import { User } from "constants/userConstants";
import { isBoolean } from "lodash";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  getBetaFlag,
  setBetaFlag,
  STORAGE_KEYS,
  getReflowOnBoardingFlag,
} from "utils/storage";

function* initReflowStates() {
  try {
    const user: User = yield select(getCurrentUser);
    const { email } = user;
    if (email) {
      const enableReflow: boolean = yield getBetaFlag(
        email,
        STORAGE_KEYS.REFLOW_BETA_FLAG,
      );
      const enableReflowHasBeenSet = isBoolean(enableReflow);
      yield put(
        setEnableReflowAction(enableReflowHasBeenSet ? enableReflow : true),
      );
      if (!enableReflowHasBeenSet) {
        setBetaFlag(email, STORAGE_KEYS.REFLOW_BETA_FLAG, true);
      }
      const isOnBoarded: boolean = yield getReflowOnBoardingFlag(email);
      yield put(
        updateReflowOnBoardingAction(
          isBoolean(isOnBoarded) ? isOnBoarded : false,
        ),
      );
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.REFLOW_BETA_FLAGS_INIT_ERROR,
      payload: {
        error,
      },
    });
  }
}

function* closeReflowOnboardingCard() {
  try {
    const user: User = yield select(getCurrentUser);
    const { email } = user;
    if (email) {
      yield setBetaFlag(email, STORAGE_KEYS.REFLOW_ONBOARDED_FLAG, true);
    }
    yield put(updateReflowOnBoardingAction(true));
  } catch (error) {
    yield put(updateReflowOnBoardingAction(true));
  }
}

export default function* reflowSagas() {
  yield all([takeLatest(ReduxActionTypes.INITIALIZE_EDITOR, initReflowStates)]);
  yield all([
    takeLatest(
      ReflowReduxActionTypes.CLOSE_ONBOARDING_CARD,
      closeReflowOnboardingCard,
    ),
  ]);
}
