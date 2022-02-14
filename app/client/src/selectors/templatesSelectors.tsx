import { AppState } from "reducers";
import { createSelector } from "reselect";
import { getOrganizationCreateApplication } from "./applicationSelectors";

export const getTemplatesSelector = (state: AppState) =>
  state.ui.templates.templates;

export const getOrganizationsForTemplateForking = (state: AppState) =>
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
