import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  RecentEntity,
  SearchCategory,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";

const initialState: GlobalSearchReduxState = {
  query: "", // used to prefill when opened via contextual help links
  modalOpen: false,
  recentEntities: [],
  recentEntitiesRestored: false,
  filterContext: {
    category: {
      id: SEARCH_CATEGORY_ID.INIT,
    },
    fieldMeta: {},
    refinements: {},
  },
};

const globalSearchReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_GLOBAL_SEARCH_QUERY]: (
    state: GlobalSearchReduxState,
    action: ReduxAction<string>,
  ) => ({ ...state, query: action.payload }),
  [ReduxActionTypes.TOGGLE_SHOW_GLOBAL_SEARCH_MODAL]: (
    state: GlobalSearchReduxState,
  ) => ({ ...state, modalOpen: !state.modalOpen }),
  [ReduxActionTypes.SET_SEARCH_FILTER_CONTEXT]: (
    state: GlobalSearchReduxState,
    action: any,
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
    refinements: {
      entities?: [string];
    };
    fieldMeta?: {
      dataType?: string;
      field?: string;
    };
  };
}

export default globalSearchReducer;
