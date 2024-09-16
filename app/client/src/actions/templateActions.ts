import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";

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

export const showTemplatesModal = (payload: { isOpenFromCanvas: boolean }) => ({
  type: ReduxActionTypes.SHOW_TEMPLATES_MODAL,
  payload,
});

export const hideTemplatesModal = () => ({
  type: ReduxActionTypes.HIDE_TEMPLATES_MODAL,
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

export const setCurrentForkingBuildingBlockName = (
  buildingBlockName: string,
) => ({
  type: ReduxActionTypes.SET_CURRENT_FORKING_BUILDING_BLOCK_NAME,
  payload: buildingBlockName,
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

export const setActiveLoadingTemplateId = (templateId: string) => ({
  type: ReduxActionTypes.SET_ACTIVE_LOADING_TEMPLATE_ID,
  payload: templateId,
});
