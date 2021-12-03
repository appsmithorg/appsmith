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
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { RecentEntity } from "components/editorComponents/GlobalSearch/utils";
import log from "loglevel";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";

const getRecentEntitiesKey = (applicationId: string, branch?: string) =>
  branch ? `${applicationId}-${branch}` : applicationId;

export function* updateRecentEntitySaga(
  actionPayload: ReduxAction<RecentEntity>,
) {
  try {
    const branch = yield select(getCurrentGitBranch);

    const applicationId = yield select(getCurrentApplicationId);

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

    const { payload: entity } = actionPayload;
    let recentEntities = yield select(
      (state: AppState) => state.ui.globalSearch.recentEntities,
    );

    recentEntities = recentEntities.slice();

    recentEntities = recentEntities.filter(
      (recentEntity: { type: string; id: string }) =>
        recentEntity.id !== entity.id,
    );
    recentEntities.unshift(entity);
    recentEntities = recentEntities.slice(0, 6);

    yield put(setRecentEntities(recentEntities));
    if (applicationId) {
      yield call(
        setRecentAppEntities,
        recentEntities,
        getRecentEntitiesKey(applicationId, branch),
      );
    }
  } catch (e) {
    log.error(e);
  }
}

export function* restoreRecentEntities(
  actionPayload: ReduxAction<{ applicationId: string; branch?: string }>,
) {
  const {
    payload: { applicationId, branch },
  } = actionPayload;
  const recentAppEntities = yield call(
    fetchRecentAppEntities,
    getRecentEntitiesKey(applicationId, branch),
  );
  yield putResolve(setRecentEntities(recentAppEntities));
  yield put(restoreRecentEntitiesSuccess());
}

export default function* globalSearchSagas() {
  yield all([
    takeLatest(ReduxActionTypes.UPDATE_RECENT_ENTITY, updateRecentEntitySaga),
    takeLatest(
      ReduxActionTypes.RESTORE_RECENT_ENTITIES_REQUEST,
      restoreRecentEntities,
    ),
  ]);
}
