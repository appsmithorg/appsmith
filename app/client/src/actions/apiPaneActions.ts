import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import type { SlashCommandPayload } from "entities/Action";

export const createNewApiAction = (
  pageId: string,
  from: EventLocation,
  apiType?: string,
): ReduxAction<{ pageId: string; from: EventLocation; apiType?: string }> => ({
  type: ReduxActionTypes.CREATE_NEW_API_ACTION,
  payload: { pageId, from, apiType },
});

export const createNewQueryAction = (
  pageId: string,
  from: EventLocation,
  datasourceId: string,
  queryDefaultTableName?: string,
): ReduxAction<{
  pageId: string;
  from: EventLocation;
  datasourceId: string;
  queryDefaultTableName?: string;
}> => ({
  type: ReduxActionTypes.CREATE_NEW_QUERY_ACTION,
  payload: { pageId, from, datasourceId, queryDefaultTableName },
});

export const executeCommandAction = (payload: SlashCommandPayload) => ({
  type: ReduxActionTypes.EXECUTE_COMMAND,
  payload: payload,
});
