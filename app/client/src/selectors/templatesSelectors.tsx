import type { Workspace } from "ee/constants/workspaceConstants";
import type { AppState } from "ee/reducers";
import { getDefaultPlugins } from "ee/selectors/entitiesSelector";
import { getFetchedWorkspaces } from "ee/selectors/workspaceSelectors";
import { hasCreateNewAppPermission } from "ee/utils/permissionHelpers";
import type { FilterKeys, Template } from "api/TemplatesApi";
import {
  BUILDING_BLOCK_EXPLORER_TYPE,
  DEFAULT_COLUMNS_FOR_EXPLORER_BUILDING_BLOCKS,
  DEFAULT_ROWS_FOR_EXPLORER_BUILDING_BLOCKS,
  WIDGET_TAGS,
} from "constants/WidgetConstants";
import Fuse from "fuse.js";
import type { Filter } from "pages/Templates/TemplateFilters";
import { TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE } from "pages/Templates/constants";
import { createSelector } from "reselect";
import type { WidgetCardProps } from "widgets/BaseWidget";
import { getIsAiAgentFlowEnabled } from "ee/selectors/aiAgentSelectors";

const fuzzySearchOptions = {
  keys: ["title", "id", "datasources", "widgets"],
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
};

const AGENT_TEMPLATES_USE_CASE = "Agent";
const AGENT_TEMPLATES_TITLE = "AI Agent";

export const getTemplatesSelector = (state: AppState) =>
  state.ui.templates.templates;

export const getTemplatesByFlagSelector = createSelector(
  (state: AppState) => state.ui.templates.templates,
  getIsAiAgentFlowEnabled,
  (templates, isAiAgentFlowEnabled) => {
    // For agents, we only show the templates that have the use case "Agent".
    // The "Agent" use case acts as a filter for use to just show the templates
    // that are relevant to agents.
    return (
      templates
        .filter((template) => {
          if (isAiAgentFlowEnabled) {
            return template.useCases.includes(AGENT_TEMPLATES_USE_CASE);
          }

          return true;
        })
        // We are using AI Agent template for creating ai agent app,
        // so we are not showing it in the templates list.
        // TODO: Once we have a new entity for ai agent, we need to remove this filter.
        .filter((template) => template.title !== AGENT_TEMPLATES_TITLE)
    );
  },
);

export const isImportingTemplateSelector = (state: AppState) =>
  state.ui.templates.isImportingTemplate;
export const isImportingTemplateToAppSelector = (state: AppState) =>
  state.ui.templates.isImportingTemplateToApp;
export const currentForkingBuildingBlockName = (state: AppState) =>
  state.ui.templates.currentForkingTemplateInfo.buildingBlock.name;
export const buildingBlocksSourcePageIdSelector = (state: AppState) =>
  state.ui.templates.buildingBlockSourcePageId;
export const showTemplateNotificationSelector = (state: AppState) =>
  state.ui.templates.templateNotificationSeen;

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

export const getBuildingBlocksList = (state: AppState) => {
  return state.ui.templates.templates.filter(
    (template) =>
      template.functions[0] === TEMPLATE_BUILDING_BLOCKS_FILTER_FUNCTION_VALUE,
  );
};

export const getBuildingBlockExplorerCards = createSelector(
  getBuildingBlocksList,
  (buildingBlocks) => {
    const adjustedBuildingBlocks: WidgetCardProps[] = buildingBlocks.map(
      (buildingBlock) => ({
        rows:
          buildingBlock.templateGridRowSize ||
          DEFAULT_ROWS_FOR_EXPLORER_BUILDING_BLOCKS,
        columns:
          buildingBlock.templateGridColumnSize ||
          DEFAULT_COLUMNS_FOR_EXPLORER_BUILDING_BLOCKS,
        type: BUILDING_BLOCK_EXPLORER_TYPE,
        displayName: buildingBlock.title,
        icon:
          buildingBlock.screenshotUrls.length > 1
            ? buildingBlock.screenshotUrls[1]
            : buildingBlock.screenshotUrls[0],
        thumbnail:
          buildingBlock.screenshotUrls.length > 1
            ? buildingBlock.screenshotUrls[1]
            : buildingBlock.screenshotUrls[0],
        tags: [WIDGET_TAGS.BUILDING_BLOCKS],
      }),
    );

    return adjustedBuildingBlocks;
  },
);

export const getFilteredTemplateList = createSelector(
  getTemplatesByFlagSelector,
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
  getTemplatesByFlagSelector,
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
  getTemplatesByFlagSelector,
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
  getFetchedWorkspaces,
  (workspaces: Workspace[]) => {
    return workspaces
      .filter((workspace) =>
        hasCreateNewAppPermission(workspace.userPermissions ?? []),
      )
      .map((workspace) => {
        return {
          label: workspace.name,
          value: workspace.id,
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
