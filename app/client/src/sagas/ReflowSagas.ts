import { setEnableReflow, updateReflowOnBoarding } from "actions/reflowActions";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { isBoolean } from "lodash";
import { widgetReflowOnBoardingState } from "reducers/uiReducers/reflowReducer";
import { all, put, takeLatest } from "redux-saga/effects";
import {
  getReflowBetaFlag,
  getReflowOnBoardingFlag,
  setReflowBetaFlag,
} from "utils/storage";

function* initReflowStates() {
  const enableReflow: boolean = yield getReflowBetaFlag();
  const enableReflowHasBeenSet = isBoolean(enableReflow);
  yield put(setEnableReflow(enableReflowHasBeenSet ? enableReflow : true));
  if (!enableReflowHasBeenSet) {
    setReflowBetaFlag(true);
  }
  const onBoardedState: widgetReflowOnBoardingState = yield getReflowOnBoardingFlag();
  yield put(
    updateReflowOnBoarding(
      onBoardedState ?? {
        done: false,
        step: -1,
      },
    ),
  );
}
export default function* reflowSagas() {
  yield all([takeLatest(ReduxActionTypes.INITIALIZE_EDITOR, initReflowStates)]);
}
