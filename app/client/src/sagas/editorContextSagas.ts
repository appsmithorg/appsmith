import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { blankPage } from "RouteBuilder";
import {
  setPanelPropertySectionState,
  setPanelSelectedPropertyTabIndex,
  setWidgetPropertySectionState,
  setWidgetSelectedPropertyTabIndex,
} from "actions/editorContextActions";

import type { CodeEditorFocusState } from "actions/editorContextActions";
import {
  setCodeEditorCursorAction,
  setFocusableInputField,
} from "actions/editorContextActions";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { getCodeTabPath } from "selectors/canvasCodeSelectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import { matchPath_BuilderSlug } from "utils/helpers";
import history from "utils/history";

/**
 * This method appends the PageId along with the focusable propertyPath
 * @param action
 */
function* setEditorFieldFocus(action: ReduxAction<CodeEditorFocusState>) {
  const { cursorPosition, key } = action.payload;

  const entityInfo = identifyEntityFromPath(window.location.pathname);
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

function* navigateToMostRecentEntity() {
  const codeTabPath: string | undefined = yield select(getCodeTabPath);
  const currentPageId: string = yield select(getCurrentPageId);
  // hack: to be fixed
  const values = matchPath_BuilderSlug(codeTabPath ?? "");
  if (codeTabPath && values?.params.pageId === currentPageId) {
    const params = history.location.search;
    history.push(`${codeTabPath}${params ?? ""}`);
  } else {
    history.push(
      blankPage({
        pageId: currentPageId,
      }),
    );
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
    takeLatest("NAVIGATE_MOST_RECENT", navigateToMostRecentEntity),
  ]);
}
