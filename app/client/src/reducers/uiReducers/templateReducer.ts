import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { Template } from "api/TemplatesApi";

const initialState: TemplatesReduxState = {
  isImportingTemplate: false,
  gettingAllTemplates: false,
  templates: [],
  similarTemplates: [],
  filters: {},
  templateSearchQuery: "",
  templateNotificationSeen: null,
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
  [ReduxActionTypes.IMPORT_TEMPLATE_TO_ORGANISATION_INIT]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplate: true,
    };
  },
  [ReduxActionTypes.IMPORT_TEMPLATE_TO_ORGANISATION_SUCCESS]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplate: false,
    };
  },
  [ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_ORGANISATION_ERROR]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplate: false,
    };
  },
  [ReduxActionTypes.GET_SIMILAR_TEMPLATES_SUCCESS]: (
    state: TemplatesReduxState,
    action: ReduxAction<Template[]>,
  ) => {
    return {
      ...state,
      similarTemplates: action.payload,
    };
  },
  [ReduxActionTypes.SET_TEMPLATE_NOTIFICATION_SEEN]: (
    state: TemplatesReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      templateNotificationSeen: action.payload,
    };
  },
});

export interface TemplatesReduxState {
  gettingAllTemplates: boolean;
  templates: Template[];
  similarTemplates: Template[];
  filters: Record<string, string[]>;
  templateSearchQuery: string;
  isImportingTemplate: boolean;
  templateNotificationSeen: boolean | null;
}

export default templateReducer;
