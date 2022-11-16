import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { EvaluatedPopupState } from "reducers/uiReducers/editorContextReducer";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { getCurrentPageId } from "selectors/editorSelectors";
import { generatePropertyKey } from "utils/editorContextUtils";

/**
 * This method appends the PageId along with the focusable propertyPath
 * @param action
 */
function* generateKeyAndSetFocusablePropertyFieldSaga(
  action: ReduxAction<{ path?: string }>,
) {
  const currentPageId: string = yield select(getCurrentPageId);

  const propertyFieldKey = generatePropertyKey(
    action.payload.path,
    currentPageId,
  );

  if (propertyFieldKey) {
    yield put({
      type: ReduxActionTypes.SET_FOCUSABLE_PROPERTY_FIELD,
      payload: {
        path: propertyFieldKey,
      },
    });
  }
}

/**
 * This method appends the PageId along with the focusable propertyPath
 * @param action
 */
function* generateKeyAndSetFocusableEditor(
  action: ReduxAction<{
    key: string | undefined;
  }>,
) {
  const currentPageId: string = yield select(getCurrentPageId);

  const { key } = action.payload;

  const propertyFieldKey = generatePropertyKey(key, currentPageId);

  if (propertyFieldKey) {
    yield put({
      type: ReduxActionTypes.SET_CODE_EDITOR_FOCUS,
      payload: { key: propertyFieldKey },
    });
  }
}

/**
 * This method appends the PageId along with the focusable propertyPath
 * @param action
 */
function* generateKeyAndSetEvalPopupState(
  action: ReduxAction<{
    key: string | undefined;
    evalPopupState: EvaluatedPopupState;
  }>,
) {
  const currentPageId: string = yield select(getCurrentPageId);

  const { evalPopupState, key } = action.payload;

  const propertyFieldKey = generatePropertyKey(key, currentPageId);

  if (propertyFieldKey) {
    yield put({
      type: ReduxActionTypes.SET_EVAL_POPUP_STATE,
      payload: { key: propertyFieldKey, evalPopupState },
    });
  }
}

export default function* editorContextSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.GENERATE_KEY_AND_SET_FOCUSABLE_PROPERTY_FIELD,
      generateKeyAndSetFocusablePropertyFieldSaga,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_KEY_AND_SET_CODE_EDITOR_LAST_FOCUS,
      generateKeyAndSetFocusableEditor,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_KEY_AND_SET_EVAL_POPUP_STATE,
      generateKeyAndSetEvalPopupState,
    ),
  ]);
}
