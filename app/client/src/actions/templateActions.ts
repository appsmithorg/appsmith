import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const getAllTemplates = () => ({
  type: ReduxActionTypes.GET_ALL_TEMPLATES_INIT,
});

export const filterTemplates = (category: string, filterList: string[]) => ({
  type: ReduxActionTypes.UPDATE_TEMPLATE_FILTERS,
  payload: {
    category,
    filterList,
  },
});

export const setTemplateSearchQuery = (query: string) => ({
  type: ReduxActionTypes.SET_TEMPLATE_SEARCH_QUERY,
  payload: query,
});

export const importTemplateToOrganisation = (
  templateId: string,
  organizationId: string,
) => ({
  type: ReduxActionTypes.IMPORT_TEMPLATE_TO_ORGANISATION_INIT,
  payload: {
    templateId,
    organizationId,
  },
});
