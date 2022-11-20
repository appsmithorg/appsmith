import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { EvaluatedPopupState } from "reducers/uiReducers/editorContextReducer";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { getCurrentPageId } from "selectors/editorSelectors";
import { generatePropertyKey } from "utils/editorContextUtils";
import {
  CodeEditorFocusState,
  setCodeEditorCursorHistory,
  setFocusableCodeEditorField,
} from "actions/editorContextActions";
import { setFocusablePropertyPaneField } from "actions/propertyPaneActions";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { setFocusableFormControlField } from "actions/queryPaneActions";
import { getActionIdFromURL } from "pages/Editor/Explorer/helpers";

/**
 * This method appends the PageId along with the focusable propertyPath
 * @param action
 */
function* generateKeyAndSetFocusableEditor(
  action: ReduxAction<CodeEditorFocusState>,
) {
  const currentPageId: string = yield select(getCurrentPageId);

  const { cursorPosition, key } = action.payload;

  const propertyFieldKey = generatePropertyKey(key, currentPageId);
  const entityInfo = identifyEntityFromPath(
    window.location.pathname,
    window.location.hash,
  );
  const ignoredEntities = [FocusEntity.PROPERTY_PANE, FocusEntity.QUERY];

  if (propertyFieldKey) {
    if (!ignoredEntities.includes(entityInfo.entity)) {
      yield put(setFocusableCodeEditorField(propertyFieldKey));
    }
    yield put(setCodeEditorCursorHistory(propertyFieldKey, cursorPosition));
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

function* generateKeyAndSetFocusablePropertyPaneField(
  action: ReduxAction<{ path?: string }>,
) {
  const currentPageId: string = yield select(getCurrentPageId);

  const propertyFieldKey = generatePropertyKey(
    action.payload.path,
    currentPageId,
  );

  if (propertyFieldKey) {
    yield put(setFocusablePropertyPaneField(propertyFieldKey));
  }
}

function* generateKeyAndSetFocusableFormControlField(
  action: ReduxAction<{ path?: string }>,
) {
  const currentPageId: string = yield select(getCurrentPageId);
  const entityInfo = identifyEntityFromPath(
    window.location.pathname,
    window.location.hash,
  );
  // To focus input fields of same identifiers of different api/queries
  // we need a different reference since the value is the same.
  const actionId = getActionIdFromURL();

  const propertyFieldKey = generatePropertyKey(
    (actionId || "") + action.payload.path,
    currentPageId,
  );

  if (propertyFieldKey && entityInfo.entity !== FocusEntity.DATASOURCE) {
    yield put(setFocusableFormControlField(propertyFieldKey));
  }
}

export default function* editorContextSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.GENERATE_KEY_AND_SET_CODE_EDITOR_LAST_FOCUS,
      generateKeyAndSetFocusableEditor,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_KEY_AND_SET_EVAL_POPUP_STATE,
      generateKeyAndSetEvalPopupState,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_KEY_AND_SET_FOCUSABLE_PROPERTY_FIELD,
      generateKeyAndSetFocusablePropertyPaneField,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_KEY_AND_SET_FORM_CONTROL_FIELD,
      generateKeyAndSetFocusableFormControlField,
    ),
  ]);
}
