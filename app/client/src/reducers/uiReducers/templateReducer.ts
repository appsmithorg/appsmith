import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { Template } from "api/TemplatesApi";

const initialState: TemplatesReduxState = {
  gettingAllTemplates: false,
  templates: [],
  filters: {},
  templateSearchQuery: "",
};

const templateReducer = createReducer(initialState, {
  [ReduxActionTypes.GET_ALL_TEMPLATES_INIT]: (state: TemplatesReduxState) => {
    return {
      ...state,
      gettingAllTemplates: true,
    };
  },
  [ReduxActionTypes.GET_ALL_TEMPLATES_SUCCESS]: (
    state: TemplatesReduxState,
    action: ReduxAction<Template[]>,
  ) => {
    return {
      ...state,
      gettingAllTemplates: false,
      templates: action.payload,
    };
  },
  [ReduxActionTypes.UPDATE_TEMPLATE_FILTERS]: (
    state: TemplatesReduxState,
    action: ReduxAction<{ category: string; filterList: string[] }>,
  ) => {
    return {
      ...state,
      filters: {
        ...state.filters,
        [action.payload.category]: action.payload.filterList,
      },
    };
  },
  [ReduxActionTypes.SET_TEMPLATE_SEARCH_QUERY]: (
    state: TemplatesReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      templateSearchQuery: action.payload,
    };
  },
});

export interface TemplatesReduxState {
  gettingAllTemplates: boolean;
  templates: Template[];
  filters: Record<string, string[]>;
  templateSearchQuery: string;
}

export default templateReducer;
