import { ReduxActionTypes } from "constants/ReduxActionConstants";

import {
  AddApiToPageRequest,
  FetchProviderWithCategoryRequest,
} from "api/ProvidersApi";

export const fetchProviders = () => {
  return {
    type: ReduxActionTypes.FETCH_PROVIDERS_INIT,
  };
};

export const fetchProviderCategories = () => {
  return {
    type: ReduxActionTypes.FETCH_PROVIDERS_CATEGORIES_INIT,
  };
};

export const fetchProviderTemplates = () => {
  return {
    type: ReduxActionTypes.FETCH_PROVIDER_TEMPLATES_INIT,
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
