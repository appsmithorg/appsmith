import { setEnableReflowAction } from "actions/reflowActions";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { User } from "constants/userConstants";
import { isBoolean } from "lodash";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { getCurrentUser } from "selectors/usersSelectors";
import { getReflowBetaFlag, setReflowBetaFlag } from "utils/storage";

function* initReflowStates() {
  try {
    const user: User = yield select(getCurrentUser);
    const { email } = user;
    if (email) {
      const enableReflow: boolean = yield getReflowBetaFlag(email);
      const enableReflowHasBeenSet = isBoolean(enableReflow);
      const appsmithEmailRegex = /@appsmith.com/g;
      const canReflow = appsmithEmailRegex.test(email);
      const enableReflowState = enableReflowHasBeenSet
        ? enableReflow
        : canReflow;
      yield put(setEnableReflowAction(enableReflowState));
      if (canReflow && !enableReflowHasBeenSet) {
        setReflowBetaFlag(email, true);
      }
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
export default function* reflowSagas() {
  yield all([takeLatest(ReduxActionTypes.INITIALIZE_EDITOR, initReflowStates)]);
}
