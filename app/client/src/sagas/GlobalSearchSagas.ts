import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import {
  all,
  call,
  put,
  takeLatest,
  select,
  putResolve,
  take,
} from "redux-saga/effects";
import { setRecentAppEntities, fetchRecentAppEntities } from "utils/storage";
import {
  restoreRecentEntitiesSuccess,
  setRecentEntities,
} from "actions/globalSearchActions";
import { AppState } from "reducers";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { getIsEditorInitialized } from "selectors/editorSelectors";

export function* updateRecentEntity(
  actionPayload: ReduxAction<{ type: string; id: string }>,
) {
  try {
    const recentEntitiesRestored = yield select(
      (state: AppState) => state.ui.globalSearch.recentEntitiesRestored,
    );
    const isEditorInitialised = yield select(getIsEditorInitialized);

    const waitForEffects = [];

    if (!isEditorInitialised) {
      waitForEffects.push(take(ReduxActionTypes.INITIALIZE_EDITOR_SUCCESS));
    }

    if (!recentEntitiesRestored) {
      waitForEffects.push(
        take(ReduxActionTypes.RESTORE_RECENT_ENTITIES_SUCCESS),
      );
    }

    yield all(waitForEffects);

    const currentApplication = yield select(getCurrentApplication);
    const { payload: entity } = actionPayload;
    let recentEntities = yield select(
      (state: AppState) => state.ui.globalSearch.recentEntities,
    );
    recentEntities = recentEntities.slice();

    const existingIndex = recentEntities.findIndex(
      (recentEntity: { type: string; id: string }) =>
        recentEntity.id === entity.id,
    );

    if (existingIndex === -1) {
      recentEntities.unshift(entity);
      recentEntities = recentEntities.slice(0, 5);
    } else {
      recentEntities.splice(existingIndex, 1);
      recentEntities.unshift(entity);
    }
    yield put(setRecentEntities(recentEntities));
    yield call(setRecentAppEntities, recentEntities, currentApplication?.id);
  } catch (e) {
    console.log(e, "error");
  }
}

export function* restoreRecentEntities(actionPayload: ReduxAction<string>) {
  const { payload: appId } = actionPayload;
  const recentAppEntities = yield call(fetchRecentAppEntities, appId);
  yield putResolve(setRecentEntities(recentAppEntities));
  yield put(restoreRecentEntitiesSuccess());
}

export default function* globalSearchSagas() {
  yield all([
    takeLatest(ReduxActionTypes.UPDATE_RECENT_ENTITY, updateRecentEntity),
    takeLatest(
      ReduxActionTypes.RESTORE_RECENT_ENTITIES_REQUEST,
      restoreRecentEntities,
    ),
  ]);
}
