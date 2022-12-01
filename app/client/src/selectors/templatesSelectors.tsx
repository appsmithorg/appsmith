import { FilterKeys, Template } from "api/TemplatesApi";
import Fuse from "fuse.js";
import { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";
import { getWorkspaceCreateApplication } from "./applicationSelectors";
import { getWidgetCards } from "./editorSelectors";
import { getDefaultPlugins } from "./entitiesSelector";
import { Filter } from "pages/Templates/Filters";

const fuzzySearchOptions = {
  keys: ["title", "id", "datasources", "widgets"],
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
};

export const getTemplatesSelector = (state: AppState) =>
  state.ui.templates.templates;
export const isImportingTemplateSelector = (state: AppState) =>
  state.ui.templates.isImportingTemplate;
export const isImportingTemplateToAppSelector = (state: AppState) =>
  state.ui.templates.isImportingTemplateToApp;
export const showTemplateNotificationSelector = (state: AppState) =>
  state.ui.templates.templateNotificationSeen;

export const getWorkspaceForTemplates = createSelector(
  getWorkspaceCreateApplication,
  (workspaceList) => {
    if (workspaceList.length) {
      return workspaceList[0];
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
export const isFetchingTemplateSelector = (state: AppState) =>
  state.ui.templates.gettingTemplate;

export const getTemplateById = (id: string) => (state: AppState) => {
  return state.ui.templates.templates.find((template) => template.id === id);
};

export const getActiveTemplateSelector = (state: AppState) =>
  state.ui.templates.activeTemplate;

export const getFilteredTemplateList = createSelector(
  getTemplatesSelector,
  getTemplateFilterSelector,
  getTemplateFiltersLength,
  (templates, templatesFilters, numberOfFiltersApplied) => {
    const result: Template[] = [];
    const activeTemplateIds: string[] = [];

    if (!numberOfFiltersApplied) {
      return templates;
    }

    if (!Object.keys(templatesFilters).length) {
      return templates;
    }

    Object.keys(templatesFilters).map((filter) => {
      templates.map((template) => {
        if (activeTemplateIds.includes(template.id)) {
          return;
        }

        if (
          template[filter as FilterKeys].some((templateFilter) => {
            return templatesFilters[filter].includes(templateFilter);
          })
        ) {
          result.push(template);
          activeTemplateIds.push(template.id);
        }
      });
    });

    return result;
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

// Get the list of datasources which are used by templates
export const templatesDatasourceFiltersSelector = createSelector(
  getTemplatesSelector,
  getDefaultPlugins,
  (templates, plugins) => {
    const datasourceFilters: Filter[] = [];
    templates.map((template) => {
      template.datasources.map((pluginIdentifier) => {
        if (
          !datasourceFilters.find((filter) => filter.value === pluginIdentifier)
        ) {
          const matchedPlugin = plugins.find(
            (plugin) =>
              plugin.id === pluginIdentifier ||
              plugin.packageName === pluginIdentifier,
          );

          if (matchedPlugin) {
            datasourceFilters.push({
              label: matchedPlugin.name,
              value: pluginIdentifier,
            });
          }
        }
      });
    });

    return datasourceFilters;
  },
);

export const templatesFiltersSelector = (state: AppState) =>
  state.ui.templates.allFilters;

// Get all filters which is associated with atleast one template
// If no template is associated with a filter, then the filter shouldn't be in the filter list
export const getFilterListSelector = createSelector(
  getWidgetCards,
  templatesDatasourceFiltersSelector,
  getTemplatesSelector,
  templatesFiltersSelector,
  (widgetConfigs, allDatasources, templates, allTemplateFilters) => {
    const filters: Record<string, Filter[]> = {
      datasources: [],
      functions: [],
    };

    const allFunctions = allTemplateFilters.functions.map((item) => {
      return {
        label: item,
        value: item,
      };
    });

    const filterFilters = (
      key: "datasources" | "widgets" | "useCases" | "functions",
      dataReference: Filter[],
      template: Template,
    ) => {
      template[key].map((templateValue) => {
        if (
          !filters[key].some((filter) => {
            if (filter.value) {
              return filter.value === templateValue;
            }
            return filter.label === templateValue;
          })
        ) {
          const filteredData = dataReference.find((datum) => {
            if (datum.value) {
              return datum.value === templateValue;
            }
            return datum.label === templateValue;
          });
          filteredData && filters[key].push(filteredData);
        }
      });
    };

    templates.map((template) => {
      filterFilters("datasources", allDatasources, template);
      filterFilters("functions", allFunctions, template);
    });

    return filters;
  },
);

export const getForkableWorkspaces = createSelector(
  getWorkspaceCreateApplication,
  (workspaces) => {
    return workspaces.map((workspace) => {
      return {
        label: workspace.workspace.name,
        value: workspace.workspace.id,
      };
    });
  },
);

export const templateModalOpenSelector = (state: AppState) =>
  state.ui.templates.showTemplatesModal;

export const templatesCountSelector = (state: AppState) =>
  state.ui.templates.templates.length;
