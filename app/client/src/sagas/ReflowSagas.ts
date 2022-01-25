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
  getReflowBetaFlag,
  getReflowOnBoardingFlag,
  setReflowOnBoardingFlag,
  setReflowBetaFlag,
} from "utils/storage";

function* initReflowStates() {
  try {
    const user: User = yield select(getCurrentUser);
    const { email } = user;
    if (email) {
      const enableReflow: boolean = yield getReflowBetaFlag(email);
      const enableReflowHasBeenSet = isBoolean(enableReflow);
      yield put(
        setEnableReflowAction(enableReflowHasBeenSet ? enableReflow : true),
      );
      if (!enableReflowHasBeenSet) {
        setReflowBetaFlag(email, true);
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
      yield setReflowOnBoardingFlag(email, true);
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
