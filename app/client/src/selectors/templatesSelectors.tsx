import { AppState } from "reducers";
import { createSelector } from "reselect";
import { getOrganizationCreateApplication } from "./applicationSelectors";

export const getTemplatesSelector = (state: AppState) =>
  state.ui.templates.templates;

export const getOrganizationForTemplates = createSelector(
  getOrganizationCreateApplication,
  (organizationList) => {
    if (organizationList.length) {
      return organizationList[0];
    }

    return null;
  },
);

export const isFetchingTemplatesSelector = (state: AppState) =>
  state.ui.templates.gettingAllTemplates;

export const getTemplateById = (id: string) => (state: AppState) => {
  return state.ui.templates.templates.find((template) => template.id === id);
};
