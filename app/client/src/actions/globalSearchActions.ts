import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  filterCategories,
  RecentEntity,
  SearchCategory,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";

export const setGlobalSearchQuery = (query: string) => ({
  type: ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY,
  payload: query,
});

export const toggleShowGlobalSearchModal = () => ({
  type: ReduxActionTypes.TOGGLE_SHOW_GLOBAL_SEARCH_MODAL,
});

export const setGlobalSearchCategory = (
  category: SearchCategory = filterCategories[SEARCH_CATEGORY_ID.DOCUMENTATION],
) => ({
  type: ReduxActionTypes.SET_GLOBAL_SEARCH_CATEGORY,
  payload: category,
});

export const cancelSnippet = () => ({
  type: ReduxActionTypes.CANCEL_SNIPPET,
});

export const evaluateSnippet = (payload: {
  expression: string;
  dataType?: string;
  isTrigger?: boolean;
}) => ({
  type: ReduxActionTypes.EVALUATE_SNIPPET,
  payload,
});

export const evaluateArgument = (payload: {
  name: string;
  type: string;
  value: string;
}) => ({
  type: ReduxActionTypes.EVALUATE_ARGUMENT,
  payload,
});

export const setEvaluatedSnippet = (payload: any) => ({
  type: ReduxActionTypes.SET_EVALUATED_SNIPPET,
  payload,
});

export const setEvaluatedArgument = (payload: any) => ({
  type: ReduxActionTypes.SET_EVALUATED_ARGUMENT,
  payload,
});

export const unsetEvaluatedArgument = () => ({
  type: ReduxActionTypes.UNSET_EVALUATED_ARGUMENT,
});

export const insertSnippet = (payload: string) => ({
  type: ReduxActionTypes.INSERT_SNIPPET,
  payload,
});

export const setGlobalSearchFilterContext = (payload: any) => ({
  type: ReduxActionTypes.SET_SEARCH_FILTER_CONTEXT,
  payload,
});

export const updateRecentEntity = (payload: RecentEntity) => ({
  type: ReduxActionTypes.UPDATE_RECENT_ENTITY,
  payload,
});

export const restoreRecentEntitiesRequest = (payload: {
  applicationId: string;
  branch?: string;
}) => ({
  type: ReduxActionTypes.RESTORE_RECENT_ENTITIES_REQUEST,
  payload,
});

export const restoreRecentEntitiesSuccess = () => ({
  type: ReduxActionTypes.RESTORE_RECENT_ENTITIES_SUCCESS,
});

export const resetRecentEntities = () => ({
  type: ReduxActionTypes.RESET_RECENT_ENTITIES,
});

export const setRecentEntities = (payload: Array<RecentEntity>) => ({
  type: ReduxActionTypes.SET_RECENT_ENTITIES,
  payload,
});
