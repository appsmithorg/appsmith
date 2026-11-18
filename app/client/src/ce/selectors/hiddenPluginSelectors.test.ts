import type { DefaultRootState } from "react-redux";
import { PluginPackageName, PluginType } from "entities/Plugin";
import store from "store";
import {
  getActions,
  getCurrentActions,
  getDatasources,
  getDatasourcesGroupedByPluginCategory,
  getHiddenPluginActions,
  getHiddenPluginIds,
  getQuerySegmentItems,
  getVisibleActions,
  getVisibleDatasources,
  isHiddenPlugin,
  PluginCategory,
} from "ee/selectors/entitiesSelector";

const PAGE_ID = "page-1";

const plugins = [
  {
    id: "ai-plugin",
    name: "Appsmith AI",
    packageName: PluginPackageName.APPSMITH_AI,
    type: PluginType.AI,
  },
  {
    id: "openai-plugin",
    name: "OpenAI",
    packageName: "openai-plugin",
    type: PluginType.AI,
  },
  {
    id: "pg-plugin",
    name: "PostgreSQL",
    packageName: PluginPackageName.POSTGRES,
    type: PluginType.DB,
  },
];

const datasources = [
  { id: "ds-ai", name: "Appsmith AI DS", pluginId: "ai-plugin" },
  { id: "ds-openai", name: "OpenAI DS", pluginId: "openai-plugin" },
  { id: "ds-pg", name: "Users DB", pluginId: "pg-plugin" },
];

const makeAction = (
  id: string,
  pluginId: string,
  pluginType: PluginType,
  datasourceId: string,
  pageId = PAGE_ID,
) => ({
  isLoading: false,
  config: {
    id,
    baseId: `base-${id}`,
    name: id,
    pageId,
    pluginId,
    pluginType,
    datasource: { id: datasourceId },
  },
});

const actions = [
  makeAction("AIQuery", "ai-plugin", PluginType.AI, "ds-ai"),
  makeAction("OpenAIQuery", "openai-plugin", PluginType.AI, "ds-openai"),
  makeAction("UsersQuery", "pg-plugin", PluginType.DB, "ds-pg"),
  makeAction("OtherPageAI", "ai-plugin", PluginType.AI, "ds-ai", "page-2"),
];

// Start from the real default state, so selectors that EE extends (such as
// getQuerySegmentItems) find the state they read in EE too.
const defaultState = store.getState();

const makeState = (pluginList = plugins) =>
  ({
    ...defaultState,
    entities: {
      ...defaultState.entities,
      plugins: { ...defaultState.entities.plugins, list: pluginList },
      datasources: { ...defaultState.entities.datasources, list: datasources },
      actions,
      pageList: { ...defaultState.entities.pageList, currentPageId: PAGE_ID },
    },
  }) as unknown as DefaultRootState;

describe("hidden plugin selectors (Appsmith AI)", () => {
  it("isHiddenPlugin is true only for the Appsmith AI plugin", () => {
    expect(isHiddenPlugin(plugins[0])).toBe(true);
    expect(isHiddenPlugin(plugins[1])).toBe(false);
    expect(isHiddenPlugin(plugins[2])).toBe(false);
    expect(isHiddenPlugin(undefined)).toBe(false);
  });

  it("getHiddenPluginIds returns the Appsmith AI plugin id", () => {
    expect([...getHiddenPluginIds(makeState())]).toEqual(["ai-plugin"]);
  });

  it("getVisibleDatasources drops Appsmith AI datasources only", () => {
    const state = makeState();

    expect(getVisibleDatasources(state).map((d) => d.id)).toEqual([
      "ds-openai",
      "ds-pg",
    ]);
  });

  it("keeps every datasource when the Appsmith AI plugin is not installed", () => {
    const state = makeState(plugins.slice(1));

    expect(getVisibleDatasources(state)).toHaveLength(3);
  });

  it("grouped datasources keep other AI integrations and drop Appsmith AI", () => {
    const grouped = getDatasourcesGroupedByPluginCategory(makeState());

    expect(grouped[PluginCategory.AI].map((d) => d.id)).toEqual(["ds-openai"]);
    expect(grouped[PluginCategory.Databases].map((d) => d.id)).toEqual([
      "ds-pg",
    ]);
  });

  it("getVisibleActions drops Appsmith AI queries on every page", () => {
    const state = makeState();

    expect(getVisibleActions(state).map((a) => a.config.id)).toEqual([
      "OpenAIQuery",
      "UsersQuery",
    ]);
  });

  it("getHiddenPluginActions returns Appsmith AI queries on every page", () => {
    expect(getHiddenPluginActions(makeState()).map((a) => a.config.id)).toEqual(
      ["AIQuery", "OtherPageAI"],
    );
    expect(getHiddenPluginActions(makeState(plugins.slice(1)))).toEqual([]);
  });

  it("the query list drops Appsmith AI queries", () => {
    const items = getQuerySegmentItems(makeState());

    expect(items.map((item) => item.title)).toEqual([
      "OpenAIQuery",
      "UsersQuery",
    ]);
  });

  it("base selectors still return Appsmith AI data for evaluation and page load", () => {
    const state = makeState();

    expect(getDatasources(state)).toHaveLength(3);
    expect(getActions(state)).toHaveLength(4);
    expect(getCurrentActions(state).map((a) => a.config.id)).toContain(
      "AIQuery",
    );
  });
});
