import { RecentActionEntity } from "actions/recentActionEnititesActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { all, call, select, takeLatest } from "redux-saga/effects";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  fetchRecentActionEntities,
  setRecentActionEntities,
} from "utils/storage";

const getRecentActionEntitiesKey = (applicationId: string, branch?: string) =>
  branch ? `${applicationId}-${branch}` : applicationId;

function* updateRecentEntitySaga(action: ReduxAction<RecentActionEntity>) {
  const branch: string | undefined = yield select(getCurrentGitBranch);
  const applicationId: string = yield select(getCurrentApplicationId);
  const pageId: string = yield select(getCurrentPageId);
  const applicationKey = getRecentActionEntitiesKey(applicationId, branch);

  const currentRecentActions: RecentActionEntity[] = yield call(
    fetchRecentActionEntities,
    applicationKey,
    pageId,
  ) ?? [];

  const newAction: RecentActionEntity = {
    id: action.payload.id,
    type: action.payload.type,
    name: action.payload.name,
  };

  const updatedRecentActions = [...currentRecentActions];
  const actionIndex = updatedRecentActions.findIndex(
    (actionItem) => actionItem.id === newAction.id,
  );

  if (actionIndex > -1) {
    updatedRecentActions.unshift(
      updatedRecentActions.splice(actionIndex, 1)[0],
    );
    AnalyticsUtil.logEvent("RECENT_ACTION_ENTITY_CLICK", {
      ...newAction,
      isRecent: true,
      recentActionslength: updatedRecentActions.length,
    });
  } else {
    updatedRecentActions.length === 5 && updatedRecentActions.pop();
    updatedRecentActions.unshift(newAction);
    AnalyticsUtil.logEvent("RECENT_ACTION_ENTITY_CLICK", {
      ...newAction,
      isRecent: false,
      recentActionslength: updatedRecentActions.length,
    });
  }

  yield call(
    setRecentActionEntities,
    updatedRecentActions,
    applicationKey,
    pageId,
  );
}

export default function* recentActionEntitiesSagas() {
  yield all([
    takeLatest(
      ReduxActionTypes.UPDATE_RECENT_ACTION_ENTITY,
      updateRecentEntitySaga,
    ),
  ]);
}
