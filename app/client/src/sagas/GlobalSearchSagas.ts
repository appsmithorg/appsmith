import {
  restoreRecentEntitiesSuccess,
  setRecentEntities,
} from "actions/globalSearchActions";
import type { RecentEntity } from "components/editorComponents/GlobalSearch/utils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { AppState } from "ee/reducers";
import log from "loglevel";
import type { FocusEntity, FocusEntityInfo } from "navigation/FocusEntity";
import {
  all,
  call,
  put,
  putResolve,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
} from "selectors/editorSelectors";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { convertToPageIdSelector } from "selectors/pageListSelectors";
import { fetchRecentAppEntities, setRecentAppEntities } from "utils/storage";

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

    const {
      entity,
      id,
      params: { basePageId },
    } = entityInfo;
    const pageId: string = yield select(
      convertToPageIdSelector,
      basePageId ?? "",
    );
    let recentEntities: RecentEntity[] = yield select(
      (state: AppState) => state.ui.globalSearch.recentEntities,
    );

    recentEntities = recentEntities.slice();

    recentEntities = recentEntities.filter(
      (recentEntity: { type: FocusEntity; id: string }) =>
        recentEntity.id !== id,
    );

    recentEntities.unshift({
      type: entity,
      id,
      pageId,
    }) as RecentEntity;
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
