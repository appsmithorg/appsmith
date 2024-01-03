import type { FilterKeys, Template } from "api/TemplatesApi";
import Fuse from "fuse.js";
import type { AppState } from "@appsmith/reducers";
import { createSelector } from "reselect";
import { getWorkspaceCreateApplication } from "@appsmith/selectors/applicationSelectors";
import { getDefaultPlugins } from "@appsmith/selectors/entitiesSelector";
import type { Filter } from "pages/Templates/Filters";

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
export const isImportingStarterBuildingBlockToAppSelector = (state: AppState) =>
  state.ui.templates.isImportingStarterBuildingBlockToApp;
export const starterBuildingBlockDatasourcePromptSelector = (state: AppState) =>
  state.ui.templates.starterBuildingBlockDatasourcePrompt;
export const buildingBlocksSourcePageIdSelector = (state: AppState) =>
  state.ui.templates.buildingBlockSourcePageId;
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
    const ALL_TEMPLATES_FILTER_VALUE = "All";

    if (!numberOfFiltersApplied) {
      return templates;
    }

    if (!Object.keys(templatesFilters).length) {
      return templates;
    }

    // If only "All Templates" is selected, return all templates
    if (
      numberOfFiltersApplied === 1 &&
      templatesFilters.functions?.includes(ALL_TEMPLATES_FILTER_VALUE)
    ) {
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

export const allTemplatesFiltersSelector = (state: AppState) =>
  state.ui.templates.allFilters;

// Get all filters which is associated with atleast one template
// If no template is associated with a filter, then the filter shouldn't be in the filter list
export const getFilterListSelector = createSelector(
  getTemplatesSelector,
  allTemplatesFiltersSelector,
  (templates, allTemplateFilters) => {
    const FUNCTIONS_FILTER = "functions";
    const filters: Record<string, Filter[]> = {
      [FUNCTIONS_FILTER]: [],
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

    templates.forEach((template) => {
      filterFilters(FUNCTIONS_FILTER, allFunctions, template);
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

export const templateModalSelector = (state: AppState) =>
  state.ui.templates.templatesModal;

export const templatesCountSelector = (state: AppState) =>
  state.ui.templates.templates.length;

export const activeLoadingTemplateId = (state: AppState) =>
  state.ui.templates.activeLoadingTemplateId;
