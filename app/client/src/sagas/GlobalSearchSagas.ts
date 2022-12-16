import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
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
import { AppState } from "@appsmith/reducers";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { RecentEntity } from "components/editorComponents/GlobalSearch/utils";
import log from "loglevel";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { FocusEntity, FocusEntityInfo } from "navigation/FocusEntity";

const getRecentEntitiesKey = (applicationId: string, branch?: string) =>
  branch ? `${applicationId}-${branch}` : applicationId;

export function* updateRecentEntitySaga(entityInfo: FocusEntityInfo) {
  try {
    const branch: string | undefined = yield select(getCurrentGitBranch);

    const applicationId: string = yield select(getCurrentApplicationId);

    const recentEntitiesRestored: boolean = yield select(
      (state: AppState) => state.ui.globalSearch.recentEntitiesRestored,
    );
    const isEditorInitialised: boolean = yield select(getIsEditorInitialized);

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

    const { entity, id, pageId } = entityInfo;
    let recentEntities: RecentEntity[] = yield select(
      (state: AppState) => state.ui.globalSearch.recentEntities,
    );

    recentEntities = recentEntities.slice();

    recentEntities = recentEntities.filter(
      (recentEntity: { type: FocusEntity; id: string }) =>
        recentEntity.id !== id,
    );
    recentEntities.unshift(<RecentEntity>{ type: entity, id, pageId });
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
  const recentAppEntities: RecentEntity[] = yield call(
    fetchRecentAppEntities,
    getRecentEntitiesKey(applicationId, branch),
  );
  yield putResolve(setRecentEntities(recentAppEntities));
  yield put(restoreRecentEntitiesSuccess());
}

export default function* globalSearchSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.RESTORE_RECENT_ENTITIES_REQUEST,
      restoreRecentEntities,
    ),
  ]);
}
