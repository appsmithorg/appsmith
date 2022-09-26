import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  setPanelFocusableField,
  setPanelPropertySectionState,
  setPanelSelectedPropertyTabIndex,
  setWidgetFocusableField,
  setWidgetPropertySectionState,
  setWidgetSelectedPropertyTabIndex,
} from "actions/editorContextActions";
import { SelectedPropertyPanel } from "reducers/uiReducers/editorContextReducer";
import { all, put, select, takeLatest } from "redux-saga/effects";
import { getSelectedPropertyPanel } from "selectors/editorContextSelectors";

function* setFocusablePropertyFieldSaga(action: ReduxAction<{ path: string }>) {
  const selectedPanel: SelectedPropertyPanel | undefined = yield select(
    getSelectedPropertyPanel,
  );
  const panelName = selectedPanel?.path;
  const path = action.payload.path;

  if (panelName) {
    yield put(setPanelFocusableField(path, panelName));
  } else {
    yield put(setWidgetFocusableField(path));
  }
}

function* setPropertySectionStateSaga(
  action: ReduxAction<{ key: string; isOpen: boolean }>,
) {
  const selectedPanel: SelectedPropertyPanel | undefined = yield select(
    getSelectedPropertyPanel,
  );
  const panelName = selectedPanel?.path;
  const { isOpen, key } = action.payload;

  if (panelName) {
    yield put(setPanelPropertySectionState(key, isOpen, panelName));
  } else {
    yield put(setWidgetPropertySectionState(key, isOpen));
  }
}

function* setSelectedPropertyTabIndexSaga(
  action: ReduxAction<{ index: number; isPanelProperty?: boolean }>,
) {
  const selectedPanel: SelectedPropertyPanel | undefined = yield select(
    getSelectedPropertyPanel,
  );
  const panelName = selectedPanel?.path;
  const { index, isPanelProperty } = action.payload;

  if (panelName && isPanelProperty) {
    yield put(setPanelSelectedPropertyTabIndex(index, panelName));
  } else {
    yield put(setWidgetSelectedPropertyTabIndex(index));
  }
}

export default function* editorContextSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.SET_FOCUSABLE_PROPERTY_FIELD,
      setFocusablePropertyFieldSaga,
    ),
    takeLatest(
      ReduxActionTypes.SET_PROPERTY_SECTION_STATE,
      setPropertySectionStateSaga,
    ),
    takeLatest(
      ReduxActionTypes.SET_SELECTED_PROPERTY_TAB_INDEX,
      setSelectedPropertyTabIndexSaga,
    ),
  ]);
}
