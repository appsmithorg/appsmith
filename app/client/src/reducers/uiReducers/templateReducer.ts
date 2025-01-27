import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "actions/ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { Template, TemplateFiltersResponse } from "api/TemplatesApi";

const initialState: TemplatesReduxState = {
  isImportingTemplate: false,
  isImportingTemplateToApp: false,
  loadingFilters: false,
  gettingAllTemplates: false,
  gettingTemplate: false,
  activeTemplate: null,
  activeLoadingTemplateId: null,
  templates: [],
  similarTemplates: [],
  filters: {
    functions: ["All"],
  },
  allFilters: {
    functions: [],
  },
  templateSearchQuery: "",
  templateNotificationSeen: null,
  templatesModal: {
    isOpen: false,
    isOpenFromCanvas: false,
  },
  currentForkingTemplateInfo: {
    buildingBlock: {
      name: "",
    },
  },
};

const templateReducer = createReducer(initialState, {
  [ReduxActionTypes.GET_ALL_TEMPLATES_INIT]: (state: TemplatesReduxState) => {
    return {
      ...state,
      gettingAllTemplates: true,
    };
  },
  [ReduxActionTypes.GET_TEMPLATE_INIT]: (state: TemplatesReduxState) => {
    return {
      ...state,
      gettingTemplate: true,
    };
  },
  [ReduxActionTypes.GET_TEMPLATE_SUCCESS]: (
    state: TemplatesReduxState,
    action: ReduxAction<Template>,
  ) => {
    return {
      ...state,
      gettingTemplate: false,
      activeTemplate: action.payload,
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
  [ReduxActionTypes.RESET_TEMPLATE_FILTERS]: (
    state: TemplatesReduxState,
  ): TemplatesReduxState => {
    return {
      ...state,
      filters: {},
      templateSearchQuery: "",
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
  [ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_INIT]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplate: true,
    };
  },
  [ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_SUCCESS]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplate: false,
    };
  },
  [ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_WORKSPACE_ERROR]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplate: false,
    };
  },
  [ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_INIT]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplateToApp: true,
    };
  },
  [ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplateToApp: true,
    };
  },
  [ReduxActionTypes.SET_ACTIVE_LOADING_TEMPLATE_ID]: (
    state: TemplatesReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      activeLoadingTemplateId: action.payload,
    };
  },
  [ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_SUCCESS]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplateToApp: false,
    };
  },
  [ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW_SUCCESS]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplateToApp: false,
      activeLoadingTemplateId: null,
    };
  },
  [ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_APPLICATION_ERROR]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      isImportingTemplateToApp: false,
    };
  },
  [ReduxActionErrorTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW_ERROR]:
    (state: TemplatesReduxState) => {
      return {
        ...state,
        isImportingTemplateToApp: false,
        activeLoadingTemplateId: null,
      };
    },
  [ReduxActionTypes.SET_CURRENT_FORKING_BUILDING_BLOCK_NAME]: (
    state: TemplatesReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      currentForkingTemplateInfo: {
        buildingBlock: {
          name: action.payload,
        },
      },
    };
  },
  [ReduxActionErrorTypes.GET_TEMPLATE_ERROR]: (state: TemplatesReduxState) => {
    return {
      ...state,
      gettingTemplate: false,
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
  [ReduxActionTypes.SHOW_TEMPLATES_MODAL]: (
    state: TemplatesReduxState,
    action: ReduxAction<{ isOpenFromCanvas: boolean }>,
  ) => {
    return {
      ...state,
      templatesModal: {
        isOpen: true,
        isOpenFromCanvas: action.payload.isOpenFromCanvas,
      },
    };
  },
  [ReduxActionTypes.HIDE_TEMPLATES_MODAL]: (state: TemplatesReduxState) => {
    return {
      ...state,
      templatesModal: {
        isOpen: false,
        isOpenFromCanvas: false,
      },
    };
  },
  [ReduxActionTypes.GET_TEMPLATE_FILTERS_INIT]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      loadingFilters: true,
    };
  },
  [ReduxActionTypes.GET_TEMPLATE_FILTERS_SUCCESS]: (
    state: TemplatesReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      loadingFilters: false,
      allFilters: action.payload,
    };
  },
  [ReduxActionErrorTypes.GET_TEMPLATE_FILTERS_ERROR]: (
    state: TemplatesReduxState,
  ) => {
    return {
      ...state,
      loadingFilters: false,
    };
  },
});

export interface TemplatesReduxState {
  allFilters: TemplateFiltersResponse["data"] | Record<string, never>;
  gettingAllTemplates: boolean;
  gettingTemplate: boolean;
  templates: Template[];
  activeTemplate: Template | null;
  activeLoadingTemplateId: string | null;
  similarTemplates: Template[];
  filters: Record<string, string[]>;
  templateSearchQuery: string;
  isImportingTemplate: boolean;
  isImportingTemplateToApp: boolean;
  buildingBlockSourcePageId?: string;
  templateNotificationSeen: boolean | null;
  templatesModal: {
    isOpen: boolean;
    isOpenFromCanvas: boolean;
  };
  loadingFilters: boolean;
  currentForkingTemplateInfo: {
    buildingBlock: {
      name: string;
    };
  };
}

export default templateReducer;
