import { Template } from "api/TemplatesApi";
import Fuse from "fuse.js";
import { AppState } from "reducers";
import { createSelector } from "reselect";
import { getOrganizationCreateApplication } from "./applicationSelectors";
import { getDefaultPlugins } from "./entitiesSelector";

const fuzzySearchOptions = {
  keys: ["title", "id", "functions", "useCases"],
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
};

export const getTemplatesSelector = (state: AppState) =>
  state.ui.templates.templates;
export const isImportingTemplateSelector = (state: AppState) =>
  state.ui.templates.isImportingTemplate;
export const showTemplateNotificationSelector = (state: AppState) =>
  state.ui.templates.templateNotificationSeen;

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

export const getTemplateFiltersLength = createSelector(
  getTemplateFilterSelector,
  (filters) => {
    return Object.values(filters)
      .map((filterList) => filterList.length)
      .reduce((c, a) => c + a, 0);
  },
);

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

export const getTemplateSearchQuery = (state: AppState) =>
  state.ui.templates.templateSearchQuery;

export const getSearchedTemplateList = createSelector(
  getFilteredTemplateList,
  getTemplateSearchQuery,
  (templates, query) => {
    if (!query) {
      return templates;
    }

    const fuzzy = new Fuse(templates, fuzzySearchOptions);
    return fuzzy.search(query);
  },
);

export const templatesDatasourceFiltersSelector = createSelector(
  getDefaultPlugins,
  (plugins) => {
    return plugins.map((plugin) => {
      return {
        label: plugin.name,
        value: plugin.packageName,
      };
    });
  },
);

export const getForkableOrganizations = createSelector(
  getOrganizationCreateApplication,
  (organisations) => {
    return organisations.map((organization) => {
      return {
        label: organization.organization.name,
        value: organization.organization.id,
      };
    });
  },
);
