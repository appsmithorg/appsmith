import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  RecentEntity,
  SearchCategory,
} from "components/editorComponents/GlobalSearch/utils";
import {
  filterCategories,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";

const initialState: GlobalSearchReduxState = {
  query: "", // used to prefill when opened via contextual help links
  modalOpen: false,
  recentEntities: [],
  recentEntitiesRestored: false,
  filterContext: {
    category: filterCategories[SEARCH_CATEGORY_ID.INIT],
  },
};

const globalSearchReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY]: (
    state: GlobalSearchReduxState,
    action: ReduxAction<string>,
  ) => ({ ...state, query: action.payload }),
  [ReduxActionTypes.TOGGLE_SHOW_GLOBAL_SEARCH_MODAL]: (
    state: GlobalSearchReduxState,
  ) => {
    return {
      ...state,
      modalOpen: !state.modalOpen,
      filterContext: initialState.filterContext,
    };
  },
  [ReduxActionTypes.SET_GLOBAL_SEARCH_CATEGORY]: (
    state: GlobalSearchReduxState,
    action: ReduxAction<SearchCategory>,
  ) => ({
    ...state,
    modalOpen: true,
    filterContext: {
      ...state.filterContext,
      category: action.payload,
    },
  }),
  [ReduxActionTypes.SET_SEARCH_FILTER_CONTEXT]: (
    state: GlobalSearchReduxState,
    action: ReduxAction<Partial<GlobalSearchReduxState["filterContext"]>>,
  ) => ({
    ...state,
    filterContext: {
      ...state.filterContext,
      ...action.payload,
    },
  }),
  [ReduxActionTypes.SET_RECENT_ENTITIES]: (
    state: GlobalSearchReduxState,
    action: ReduxAction<Array<RecentEntity>>,
  ) => ({
    ...state,
    recentEntities: (action.payload || []).filter((a: RecentEntity) => a),
  }),
  [ReduxActionTypes.RESET_RECENT_ENTITIES]: (
    state: GlobalSearchReduxState,
  ) => ({
    ...state,
    recentEntities: [],
    recentEntitiesRestored: false,
  }),
  [ReduxActionTypes.RESTORE_RECENT_ENTITIES_SUCCESS]: (
    state: GlobalSearchReduxState,
  ) => ({
    ...state,
    recentEntitiesRestored: true,
  }),
});

export interface GlobalSearchReduxState {
  query: string;
  modalOpen: boolean;
  recentEntities: Array<RecentEntity>;
  recentEntitiesRestored: boolean;
  filterContext: {
    category: SearchCategory;
  };
}

export default globalSearchReducer;
