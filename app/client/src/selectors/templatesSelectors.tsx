import { Template } from "api/TemplatesApi";
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

export const getTemplateFilterSelector = (state: AppState) =>
  state.ui.templates.filters;

export const isFetchingTemplatesSelector = (state: AppState) =>
  state.ui.templates.gettingAllTemplates;

export const getTemplateById = (id: string) => (state: AppState) => {
  return state.ui.templates.templates.find((template) => template.id === id);
};

export const getFilteredTemplateList = createSelector(
  getTemplatesSelector,
  getTemplateFilterSelector,
  (templates, templatesFilters) => {
    if (Object.keys(templatesFilters).length) {
      return templates.filter((template) => {
        return Object.keys(templatesFilters).every((filterKey) => {
          if (!templatesFilters[filterKey].length) return true;

          return templatesFilters[filterKey].every((value: string) =>
            template[filterKey as keyof Template].includes(value),
          );
        });
      });
    }

    return templates;
  },
);
