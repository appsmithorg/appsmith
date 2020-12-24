/* eslint-disable @typescript-eslint/ban-types */
import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";

import {
  Providers,
  ProvidersDataArray,
  ProviderTemplates,
  ProviderTemplateArray,
  ProvidersCategoriesResponse,
  SearchResultsProviders,
  FetchProviderDetailsResponse,
} from "constants/providerConstants";
import { SearchApiOrProviderResponse } from "api/ProvidersApi";

const initialState: ProvidersReduxState = {
  isFetchingProviders: false,
  providers: [],
  providersTotal: 0,
  providerTemplates: [],
  isFetchingProviderTemplates: false,
  providerCategories: [],
  providerCategoriesErrorPayload: {},
  apiOrProviderSearchResults: {
    providers: [],
  },
  isSwitchingCategory: true,
  isSearching: false,
  lastUsedProviderId: "",
  providerDetailsByProviderId: {},
  providerDetailsErrorPayload: {},
  fetchProvidersError: false,
};

const providersReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PROVIDERS_INIT]: (state: ProvidersReduxState) => ({
    ...state,
    isFetchingProviders: true,
  }),
  [ReduxActionTypes.SEARCH_APIORPROVIDERS_INIT]: (
    state: ProvidersReduxState,
  ) => ({
    ...state,
    isSearching: true,
  }),
  [ReduxActionTypes.FETCH_PROVIDERS_WITH_CATEGORY_INIT]: (
    state: ProvidersReduxState,
  ) => ({
    ...state,
    isFetchingProviders: true,
  }),
  [ReduxActionTypes.ADD_API_TO_PAGE_INIT]: (
    state: ProvidersReduxState,
    action: any,
  ) => {
    const updatedProviderTemplates = state.providerTemplates.map((item) => {
      if (item.templateData.id === action.payload.marketplaceElement.item.id) {
        item.addToPageLoading = true;
        return item;
      }
      return item;
    });
    return { ...state, providerTemplates: updatedProviderTemplates };
  },
  [ReduxActionTypes.FETCH_PROVIDERS_SUCCESS]: (
    state: ProvidersReduxState,
    action: ReduxAction<Providers>,
  ) => {
    if (state.providers.length === 0) {
      return {
        ...state,
        providers: action.payload.providers,
        providersTotal: action.payload.total,
        isFetchingProviders: false,
        isSwitchingCategory: false,
        fetchProvidersError: false,
      };
    } else {
      return {
        ...state,
        providers: [...state.providers, ...action.payload.providers],
        isFetchingProviders: false,
      };
    }
  },
  [ReduxActionTypes.SET_PROVIDERS_LENGTH]: (state: ProvidersReduxState) => ({
    ...state,
    providersTotal: state.providers.length,
  }),
  [ReduxActionTypes.SEARCH_APIORPROVIDERS_SUCCESS]: (
    state: ProvidersReduxState,
    action: ReduxAction<SearchApiOrProviderResponse>,
  ) => ({
    ...state,
    isSearching: false,
    apiOrProviderSearchResults: action.payload,
  }),
  [ReduxActionErrorTypes.FETCH_PROVIDERS_ERROR]: (
    state: ProvidersReduxState,
  ) => {
    return {
      ...state,
      isFetchingProviders: false,
      isSwitchingCategory: false,
      fetchProvidersError: true,
    };
  },
  [ReduxActionErrorTypes.SEARCH_APIORPROVIDERS_ERROR]: (
    state: ProvidersReduxState,
  ) => {
    return { ...state, isSearching: false };
  },
  [ReduxActionTypes.FETCH_PROVIDER_TEMPLATES_INIT]: (
    state: ProvidersReduxState,
    action: any,
  ) => {
    return {
      ...state,
      isFetchingProviderTemplates: true,
      lastUsedProviderId: action.payload.providerId,
    };
  },
  [ReduxActionTypes.CLEAR_PROVIDERS]: (state: ProvidersReduxState) => ({
    ...state,
    providers: [],
    isSwitchingCategory: true,
  }),
  [ReduxActionTypes.FETCH_PROVIDER_TEMPLATES_SUCCESS]: (
    state: ProvidersReduxState,
    action: ReduxAction<ProviderTemplates[]>,
  ) => {
    const templates = action.payload.map((payload) => ({
      isOpen: false,
      templateData: payload,
      addToPageStatus: false,
    }));
    return {
      ...state,
      providerTemplates: templates,
      isFetchingProviderTemplates: false,
    };
  },
  [ReduxActionErrorTypes.FETCH_PROVIDER_TEMPLATES_ERROR]: (
    state: ProvidersReduxState,
  ) => {
    return { ...state, isFetchingProviderTemplates: false };
  },
  [ReduxActionTypes.ADD_API_TO_PAGE_SUCCESS]: (
    state: ProvidersReduxState,
    action: ProviderTemplates,
  ) => {
    const updatedProviderTemplates = state.providerTemplates.map((item) => {
      if (item.templateData.id === action.data.templateId) {
        item.addToPageStatus = true;
        item.addToPageLoading = false;
        return item;
      }
      return item;
    });
    return { ...state, providerTemplates: updatedProviderTemplates };
  },
  [ReduxActionErrorTypes.ADD_API_TO_PAGE_ERROR]: (
    state: ProvidersReduxState,
    action: any,
  ) => {
    const updatedProviderTemplates = state.providerTemplates.map((item) => {
      if (item.templateData.id === action.payload.templateId) {
        item.addToPageLoading = false;
        return item;
      }
      return item;
    });
    return { ...state, providerTemplates: updatedProviderTemplates };
  },
  [ReduxActionTypes.FETCH_PROVIDERS_CATEGORIES_SUCCESS]: (
    state: ProvidersReduxState,
    action: ReduxAction<ProvidersCategoriesResponse>,
  ) => {
    return {
      ...state,
      providerCategories: action.payload,
    };
  },
  [ReduxActionErrorTypes.FETCH_PROVIDERS_CATEGORIES_ERROR]: (
    state: ProvidersReduxState,
    action: ReduxAction<{ providerCategoriesErrorPayload: string }>,
  ) => {
    return { ...state, providerCategoriesErrorPayload: action.payload };
  },
  [ReduxActionTypes.FETCH_PROVIDER_DETAILS_BY_PROVIDER_ID_SUCCESS]: (
    state: ProvidersReduxState,
    action: ReduxAction<FetchProviderDetailsResponse>,
  ) => {
    return {
      ...state,
      providerDetailsByProviderId: action.payload,
    };
  },
  [ReduxActionErrorTypes.FETCH_PROVIDER_DETAILS_BY_PROVIDER_ID_ERROR]: (
    state: ProvidersReduxState,
    action: ReduxAction<{ providerDetailsErrorPayload: string }>,
  ) => {
    return { ...state, providerDetailsErrorPayload: action.payload };
  },
});

export interface ProvidersReduxState {
  isFetchingProviders: boolean;
  providers: ProvidersDataArray[];
  providersTotal: number;
  providerTemplates: ProviderTemplateArray[];
  isFetchingProviderTemplates: boolean;
  providerCategories: string[];
  providerCategoriesErrorPayload: {};
  isSwitchingCategory: boolean;
  isSearching: boolean;
  apiOrProviderSearchResults: {
    providers: SearchResultsProviders[];
  };
  lastUsedProviderId: string;
  providerDetailsByProviderId: {};
  providerDetailsErrorPayload: {};
  fetchProvidersError: boolean;
}

export default providersReducer;
