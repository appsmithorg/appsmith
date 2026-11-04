import { toast } from "@appsmith/ads";
import {
  deleteAction,
  type DeleteHiddenPluginActionsPayload,
} from "actions/pluginActionActions";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { ApiResponse } from "api/ApiResponses";
import DatasourcesApi from "ee/api/DatasourcesApi";
import {
  APPSMITH_AI_QUERIES_DELETED,
  createMessage,
} from "ee/constants/messages";
import log from "loglevel";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ActionDataState } from "ee/reducers/entityReducers/actionsReducer";
import { getActions } from "ee/selectors/entitiesSelector";
import type { Datasource } from "entities/Datasource";
import { call, put, select, takeLeading } from "redux-saga/effects";
import { deleteActionSaga } from "./ActionSagas";
import { validateResponse } from "./ErrorSagas";

/**
 * Deletes the queries of hidden plugins (see isHiddenPlugin), then the
 * datasources they used.
 *
 * - Queries are deleted one at a time through deleteActionSaga, the same path
 *   as the editor's Delete. DELETE_ACTION_INIT uses takeLatest, so dispatching
 *   several deletes at once would cancel all but the last one.
 * - Datasources belong to the workspace, not the app. The server refuses to
 *   delete one that any query still uses, or that the user may not delete.
 *   Those refusals are expected, so they are not shown to the user.
 */
export function* deleteHiddenPluginActionsSaga(
  action: ReduxAction<DeleteHiddenPluginActionsPayload>,
) {
  const { actions, datasourceIds, onComplete } = action.payload;

  for (const { id, name } of actions) {
    yield call(deleteActionSaga, deleteAction({ id, name }));
  }

  const remainingActions: ActionDataState = yield select(getActions);
  const remainingIds = new Set(
    remainingActions.map((remaining) => remaining.config.id),
  );
  const removedCount = actions.filter(({ id }) => !remainingIds.has(id)).length;

  for (const datasourceId of datasourceIds) {
    try {
      const response: ApiResponse<Datasource> = yield call(
        DatasourcesApi.deleteDatasource,
        datasourceId,
      );
      const isValidResponse: boolean = yield call(
        validateResponse,
        response,
        false,
      );

      if (isValidResponse) {
        yield put({
          type: ReduxActionTypes.DELETE_DATASOURCE_SUCCESS,
          payload: response.data,
        });
      }
    } catch (error) {
      // Usually expected: another query still uses the datasource (the
      // deployed version of this app counts), or the user may not delete it.
      // Logged for debugging only; the server message is not shown.
      log.debug("Appsmith AI datasource was not deleted", datasourceId, error);
    }
  }

  if (removedCount > 0) {
    toast.show(createMessage(APPSMITH_AI_QUERIES_DELETED, removedCount), {
      kind: "success",
    });
  }

  onComplete?.(removedCount);
}

export default function* watchDeleteHiddenPluginActionsSaga() {
  yield takeLeading(
    ReduxActionTypes.DELETE_HIDDEN_PLUGIN_ACTIONS_INIT,
    deleteHiddenPluginActionsSaga,
  );
}
