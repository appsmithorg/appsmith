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
  setFocusableInputField,
} from "actions/editorContextActions";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";

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
  const ignoredEntities = [FocusEntity.DATASOURCE, FocusEntity.PROPERTY_PANE];

  if (key) {
    if (!ignoredEntities.includes(entityInfo.entity)) {
      yield put(setFocusableInputField(key));
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
    takeLatest(ReduxActionTypes.SET_EDITOR_FIELD_FOCUS, setEditorFieldFocus),
  ]);
}
