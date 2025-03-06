import type { FocusEntityInfo } from "navigation/FocusEntity";
import { FocusEntity } from "navigation/FocusEntity";
import { all, call, put, select, takeEvery } from "redux-saga/effects";
import { getJSTabs, getQueryTabs } from "selectors/ideSelectors";
import {
  setIdeEditorViewMode,
  setJSTabs,
  setQueryTabs,
} from "actions/ideActions";
import history from "../utils/history";
import {
  jsCollectionAddURL,
  jsCollectionListURL,
  queryAddURL,
  queryListURL,
} from "ee/RouteBuilder";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { getQueryEntityItemUrl } from "ee/pages/AppIDE/layouts/routers/utils/getQueryEntityItemUrl";
import { getJSEntityItemUrl } from "ee/pages/AppIDE/layouts/routers/utils/getJSEntityItemUrl";
import log from "loglevel";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { EditorViewMode } from "IDE/Interfaces/EditorTypes";
import { retrieveIDEViewMode, storeIDEViewMode } from "utils/storage";
import {
  selectJSSegmentEditorTabs,
  selectQuerySegmentEditorTabs,
} from "ee/selectors/appIDESelectors";
import { getCurrentBasePageId } from "selectors/editorSelectors";
import {
  getNextEntityAfterRemove,
  RedirectAction,
} from "IDE/utils/getNextEntityAfterRemove";
import { getUpdatedTabs } from "IDE/utils/getUpdatedTabs";

export function* updateIDETabsOnRouteChangeSaga(entityInfo: FocusEntityInfo) {
  const { entity, id, params } = entityInfo;

  if (!params.basePageId) return;

  if (
    entity === FocusEntity.JS_OBJECT ||
    entity === FocusEntity.JS_MODULE_INSTANCE
  ) {
    const jsTabs: string[] = yield select(getJSTabs);
    const newTabs: string[] = yield call(getUpdatedTabs, id, jsTabs);

    yield put(setJSTabs(newTabs, params.basePageId));
  }

  if (
    entity === FocusEntity.QUERY ||
    entity === FocusEntity.QUERY_MODULE_INSTANCE
  ) {
    const queryTabs: string[] = yield select(getQueryTabs);
    const newTabs: string[] = yield call(getUpdatedTabs, id, queryTabs);

    yield put(setQueryTabs(newTabs, params.basePageId));
  }
}

export function* handleJSEntityRedirect(deletedId: string) {
  const basePageId: string = yield select(getCurrentBasePageId);
  const jsTabs: EntityItem[] = yield select(selectJSSegmentEditorTabs);
  const redirectAction = getNextEntityAfterRemove(deletedId, jsTabs);

  switch (redirectAction.action) {
    case RedirectAction.LIST:
      history.push(jsCollectionListURL({ basePageId }));
      break;
    case RedirectAction.ITEM:
      if (!redirectAction.payload) {
        log.error("Redirect item does not have a payload");
        history.push(jsCollectionAddURL({ basePageId }));
        break;
      }

      const { payload } = redirectAction;

      history.push(getJSEntityItemUrl(payload, basePageId));
      break;
  }
}

export function* handleQueryEntityRedirect(deletedId: string) {
  const basePageId: string = yield select(getCurrentBasePageId);
  const queryTabs: EntityItem[] = yield select(selectQuerySegmentEditorTabs);
  const redirectAction = getNextEntityAfterRemove(deletedId, queryTabs);

  switch (redirectAction.action) {
    case RedirectAction.LIST:
      history.push(queryListURL({ basePageId }));
      break;
    case RedirectAction.ITEM:
      if (!redirectAction.payload) {
        history.push(queryAddURL({ basePageId }));
        log.error("Redirect item does not have a payload");
        break;
      }

      const { payload } = redirectAction;

      history.push(getQueryEntityItemUrl(payload, basePageId));
      break;
  }
}

function* storeIDEViewChangeSaga(
  action: ReduxAction<{ view: EditorViewMode }>,
) {
  yield call(storeIDEViewMode, action.payload.view);
}

function* restoreIDEViewModeSaga() {
  const storedState: EditorViewMode = yield call(retrieveIDEViewMode);

  if (storedState) {
    yield put(setIdeEditorViewMode(storedState));
  }
}

export default function* root() {
  yield all([
    takeEvery(
      ReduxActionTypes.SET_IDE_EDITOR_VIEW_MODE,
      storeIDEViewChangeSaga,
    ),
    takeEvery(
      ReduxActionTypes.RESTORE_IDE_EDITOR_VIEW_MODE,
      restoreIDEViewModeSaga,
    ),
  ]);
}
