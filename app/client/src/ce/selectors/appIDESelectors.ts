import { groupBy, sortBy } from "lodash";
import { createSelector } from "reselect";
import { PluginType } from "entities/Action";
import {
  isEmbeddedAIDataSource,
  isEmbeddedRestDatasource,
} from "entities/Datasource";
import {
  getCurrentActions,
  getCurrentJSCollections,
  selectDatasourceIdToNameMap,
} from "./entitiesSelector";

export type EditorSegmentList = Array<{
  group: string | "NA";
  items: EntityItem[];
}>;

export interface EntityItem {
  title: string;
  type: PluginType;
  key: string;
  group?: string;
}

const groupAndSortEntitySegmentList = (
  items: EntityItem[],
): EditorSegmentList => {
  const groups = groupBy(items, (item) => {
    if (item.group) return item.group;
    return "NA";
  });

  // Entity Segment Lists are sorted alphabetically at both group and item level
  return sortBy(
    Object.keys(groups).map((group) => {
      return {
        group: group,
        items: sortBy(groups[group], "title"),
      };
    }),
    "group",
  );
};

function recentSortEntitySegmentTabs(items: EntityItem[]) {
  // TODO Temp implementation
  return sortBy(items, "title");
}

export const getQuerySegmentItems = createSelector(
  getCurrentActions,
  selectDatasourceIdToNameMap,
  (actions, datasourceIdToNameMap) => {
    const items: EntityItem[] = actions.map((action) => {
      let group;
      if (action.config.pluginType === PluginType.API) {
        group = isEmbeddedRestDatasource(action.config.datasource)
          ? "APIs"
          : datasourceIdToNameMap[action.config.datasource.id] ?? "APIs";
      } else if (action.config.pluginType === PluginType.AI) {
        group = isEmbeddedAIDataSource(action.config.datasource)
          ? "AI Queries"
          : datasourceIdToNameMap[action.config.datasource.id] ?? "AI Queries";
      } else {
        group = datasourceIdToNameMap[action.config.datasource.id];
      }
      return {
        title: action.config.name,
        key: action.config.id,
        type: action.config.pluginType,
        group,
      };
    });
    return items;
  },
);
export const selectQuerySegmentEditorList = createSelector(
  getQuerySegmentItems,
  (items) => {
    return groupAndSortEntitySegmentList(items);
  },
);
export const getJSSegmentItems = createSelector(
  getCurrentJSCollections,
  (jsActions) => {
    const items: EntityItem[] = jsActions.map((js) => ({
      title: js.config.name,
      key: js.config.id,
      type: PluginType.JS,
    }));
    return items;
  },
);
export const selectJSSegmentEditorList = createSelector(
  getJSSegmentItems,
  (items) => {
    return groupAndSortEntitySegmentList(items);
  },
);

export const selectJSSegmentEditorTabs = createSelector(
  getJSSegmentItems,
  (items) => {
    return recentSortEntitySegmentTabs(items);
  },
);

export const selectQuerySegmentEditorTabs = createSelector(
  getQuerySegmentItems,
  (items) => {
    return recentSortEntitySegmentTabs(items);
  },
);
