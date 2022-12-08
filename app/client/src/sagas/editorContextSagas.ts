import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  setPanelPropertySectionState,
  setPanelSelectedPropertyTabIndex,
  setWidgetPropertySectionState,
  setWidgetSelectedPropertyTabIndex,
} from "actions/editorContextActions";

import { all, put, takeLatest } from "redux-saga/effects";
import {
  CodeEditorFocusState,
  setCodeEditorCursorAction,
  setFocusableCodeEditorField,
} from "actions/editorContextActions";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { setFocusableFormControlField } from "actions/queryPaneActions";

/**
 * This method appends the PageId along with the focusable propertyPath
 * @param action
 */
function* setEditorFieldFocus(action: ReduxAction<CodeEditorFocusState>) {
  const { cursorPosition, key } = action.payload;

  const entityInfo = identifyEntityFromPath(
    window.location.pathname,
    window.location.hash,
  );
  const ignoredEntities = [FocusEntity.PROPERTY_PANE, FocusEntity.QUERY];

  if (key) {
    if (!ignoredEntities.includes(entityInfo.entity)) {
      yield put(setFocusableCodeEditorField(key));
    }
    yield put(setCodeEditorCursorAction(key, cursorPosition));
  }
}

function* setPropertySectionStateSaga(
  action: ReduxAction<{
    key: string;
    isOpen: boolean;
    panelPropertyPath?: string;
  }>,
) {
  const { isOpen, key, panelPropertyPath } = action.payload;

  if (panelPropertyPath) {
    yield put(setPanelPropertySectionState(key, isOpen, panelPropertyPath));
  } else {
    yield put(setWidgetPropertySectionState(key, isOpen));
  }
}

function* setSelectedPropertyTabIndexSaga(
  action: ReduxAction<{ index: number; panelPropertyPath?: string }>,
) {
  const { index, panelPropertyPath } = action.payload;

  if (panelPropertyPath) {
    yield put(setPanelSelectedPropertyTabIndex(index, panelPropertyPath));
  } else {
    yield put(setWidgetSelectedPropertyTabIndex(index));
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

  const propertyFieldKey = generatePropertyKey(
    action.payload.path,
    currentPageId,
  );

  if (propertyFieldKey && entityInfo.entity !== FocusEntity.DATASOURCE) {
    yield put(setFocusableFormControlField(propertyFieldKey));
  }
}

export default function* editorContextSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.SET_PROPERTY_SECTION_STATE,
      setPropertySectionStateSaga,
    ),
    takeLatest(
      ReduxActionTypes.SET_SELECTED_PROPERTY_TAB_INDEX,
      setSelectedPropertyTabIndexSaga,
    ),
    takeLatest(
      ReduxActionTypes.GENERATE_KEY_AND_SET_FORM_CONTROL_FIELD,
      generateKeyAndSetFocusableFormControlField,
    ),
    takeLatest(ReduxActionTypes.SET_EDITOR_FIELD_FOCUS, setEditorFieldFocus),
  ]);
}
