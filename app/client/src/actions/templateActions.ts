import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

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

export const importTemplateToWorkspace = (
  templateId: string,
  workspaceId: string,
) => ({
  type: ReduxActionTypes.IMPORT_TEMPLATE_TO_WORKSPACE_INIT,
  payload: {
    templateId,
    workspaceId,
  },
});

export const getSimilarTemplatesInit = (templateId: string) => ({
  type: ReduxActionTypes.GET_SIMILAR_TEMPLATES_INIT,
  payload: templateId,
});

export const setTemplateNotificationSeenAction = (payload: boolean) => ({
  type: ReduxActionTypes.SET_TEMPLATE_NOTIFICATION_SEEN,
  payload,
});

export const getTemplateNotificationSeenAction = () => ({
  type: ReduxActionTypes.GET_TEMPLATE_NOTIFICATION_SEEN,
});

export const getTemplateInformation = (payload: string) => ({
  type: ReduxActionTypes.GET_TEMPLATE_INIT,
  payload,
});

export const showTemplatesModal = (payload: boolean) => ({
  type: ReduxActionTypes.SHOW_TEMPLATES_MODAL,
  payload,
});

export const importTemplateIntoApplication = (
  templateId: string,
  templateName: string,
  pageNames?: string[],
) => ({
  type: ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_INIT,
  payload: {
    templateId,
    templateName,
    pageNames,
  },
});

export const importStarterBuildingBlockIntoApplication = (
  templateId: string,
  templateName: string,
  templatePageName: string,
) => ({
  type: ReduxActionTypes.IMPORT_STARTER_BUILDING_BLOCK_TO_APPLICATION_INIT,
  payload: {
    templateId,
    templateName,
    pageNames: [templatePageName],
  },
});

export const showStarterBuildingBlockDatasourcePrompt = (
  buildingBlockSourcePageId: string,
) => ({
  type: ReduxActionTypes.SHOW_STARTER_BUILDING_BLOCK_DATASOURCE_PROMPT,
  payload: buildingBlockSourcePageId,
});

export const hideStarterBuildingBlockDatasourcePrompt = () => ({
  type: ReduxActionTypes.HIDE_STARTER_BUILDING_BLOCK_DATASOURCE_PROMPT,
});

export const getTemplateFilters = () => ({
  type: ReduxActionTypes.GET_TEMPLATE_FILTERS_INIT,
});

export const importTemplateIntoApplicationViaOnboardingFlow = (
  templateId: string,
  templateName: string,
  pageNames: string[],
  applicationId: string,
  workspaceId: string,
) => ({
  type: ReduxActionTypes.IMPORT_TEMPLATE_TO_APPLICATION_ONBOARDING_FLOW,
  payload: {
    templateId,
    templateName,
    pageNames,
    applicationId,
    workspaceId,
  },
});
