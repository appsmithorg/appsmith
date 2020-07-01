import { ReduxActionTypes } from "constants/ReduxActionConstants";

import {
  AddApiToPageRequest,
  FetchProviderWithCategoryRequest,
  SearchApiOrProviderRequest,
} from "api/ProvidersApi";

export const fetchProviders = () => {
  return {
    type: ReduxActionTypes.FETCH_PROVIDERS_INIT,
  };
};

export const searchApiOrProvider = (payload: SearchApiOrProviderRequest) => {
  return {
    type: ReduxActionTypes.SEARCH_APIORPROVIDERS_INIT,
    payload,
  };
};

export const fetchProviderCategories = () => {
  return {
    type: ReduxActionTypes.FETCH_PROVIDERS_CATEGORIES_INIT,
  };
};

export const getProviderDetailsByProviderId = (providerId: string) => {
  return {
    type: ReduxActionTypes.FETCH_PROVIDER_DETAILS_BY_PROVIDER_ID_INIT,
    payload: { providerId },
  };
};
export const fetchProviderTemplates = (providerId: string) => {
  return {
    type: ReduxActionTypes.FETCH_PROVIDER_TEMPLATES_INIT,
    payload: { providerId },
  };
};

export const addApiToPage = (payload: AddApiToPageRequest) => {
  return {
    type: ReduxActionTypes.ADD_API_TO_PAGE_INIT,
    payload,
  };
};

export const fetchProvidersWithCategory = (
  payload: FetchProviderWithCategoryRequest,
) => {
  return {
    type: ReduxActionTypes.FETCH_PROVIDERS_WITH_CATEGORY_INIT,
    payload,
  };
};

export const clearProviders = () => {
  return {
    type: ReduxActionTypes.CLEAR_PROVIDERS,
  };
};
