import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";

export interface RecentActionEntity {
  id: string;
  name: string;
  type: string;
}

export const updateRecentActionEntity = (
  payload: RecentActionEntity,
): ReduxAction<RecentActionEntity> => ({
  type: ReduxActionTypes.UPDATE_RECENT_ACTION_ENTITY,
  payload,
});
