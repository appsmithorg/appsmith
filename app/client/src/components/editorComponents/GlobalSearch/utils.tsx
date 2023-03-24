import React, { useEffect, useState } from "react";
import {
  ACTION_OPERATION_DESCRIPTION,
  createMessage,
  DOC_DESCRIPTION,
  NAV_DESCRIPTION,
  SNIPPET_DESCRIPTION,
} from "@appsmith/constants/messages";
import type { ValidationTypes } from "constants/WidgetValidation";
import type { Datasource } from "entities/Datasource";
import { fetchRawGithubContentList } from "./githubHelper";
import { PluginPackageName, PluginType } from "entities/Action";
import type { WidgetType } from "constants/WidgetConstants";
import type { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { getPluginByPackageName } from "selectors/entitiesSelector";
import type { AppState } from "@appsmith/reducers";
import WidgetFactory from "utils/WidgetFactory";
import {
  CurlIconV2,
  GraphQLIconV2,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import { createNewApiAction } from "actions/apiPaneActions";
import { createNewJSCollection } from "actions/jsPaneActions";
import type { EventLocation } from "utils/AnalyticsUtil";
import { getQueryParams } from "utils/URLUtils";
import history from "utils/history";
import { curlImportPageURL } from "RouteBuilder";
import { isMacOrIOS, modText, shiftText } from "utils/helpers";
import { FocusEntity } from "navigation/FocusEntity";

export type SelectEvent =
  | React.MouseEvent
  | React.KeyboardEvent
  | KeyboardEvent
  | null;

export type RecentEntity = {
  type: FocusEntity;
  id: string;
  pageId: string;
};

export enum SEARCH_CATEGORY_ID {
  SNIPPETS = "Snippets",
  DOCUMENTATION = "Documentation",
  NAVIGATION = "Navigate",
  INIT = "INIT",
  ACTION_OPERATION = "Create New",
}

export enum SEARCH_ITEM_TYPES {
  document = "document",
  action = "action",
  widget = "widget",
  datasource = "datasource",
  page = "page",
  sectionTitle = "sectionTitle",
  placeholder = "placeholder",
  jsAction = "jsAction",
  category = "category",
  snippet = "snippet",
  actionOperation = "actionOperation",
}

export type DocSearchItem = {
  document?: string;
  title: string;
  _highlightResult: {
    document: { value: string };
    title: { value: string };
  };
  kind: string;
  path: string;
};

export const comboHelpText = {
  [SEARCH_CATEGORY_ID.SNIPPETS]: <>{modText()} J</>,
  [SEARCH_CATEGORY_ID.DOCUMENTATION]: <>{modText()} L</>,
  [SEARCH_CATEGORY_ID.NAVIGATION]: <>{modText()} P</>,
  [SEARCH_CATEGORY_ID.INIT]: <>{modText()} K</>,
  [SEARCH_CATEGORY_ID.ACTION_OPERATION]: (
    <>
      {modText()} {shiftText()} {isMacOrIOS() ? "+" : "Plus"}
    </>
  ),
};

export type Snippet = {
  entities?: [string];
  fields?: [string];
  dataType?: string;
  language: string;
  body: SnippetBody;
};

export type SnippetBody = {
  title: string;
  snippet: string;
  isTrigger?: boolean;
  args: [SnippetArgument];
  summary: string;
  template: string;
  snippetMeta?: string;
  shortTitle?: string;
};

export type FilterEntity = WidgetType | ENTITY_TYPE;

export const filterEntityTypeLabels: Partial<Record<ENTITY_TYPE, string>> = {
  ACTION: "All Queries",
  WIDGET: "All Widgets",
  JSACTION: "JS Objects",
};

export const getSnippetFilterLabel = (state: AppState, label: string) => {
  return (
    WidgetFactory.widgetConfigMap.get(label as WidgetType)?.widgetName ||
    getPluginByPackageName(state, label)?.name ||
    filterEntityTypeLabels[label as ENTITY_TYPE] ||
    label
  );
};

export type SnippetArgument = {
  identifier: string;
  name: string;
  type: ValidationTypes;
  placeholder?: boolean;
};

export type SearchCategory = {
  id: SEARCH_CATEGORY_ID;
  kind?: SEARCH_ITEM_TYPES;
  title?: string;
  desc?: string;
  show?: () => boolean;
};

export function getOptionalFilters(optionalFilterMeta: any) {
  return Object.entries(optionalFilterMeta || {}).reduce(
    (acc: Array<string>, [key, value]: any) => {
      value.forEach((value: string) => acc.push(`${key}:${value}`));
      return acc;
    },
    [],
  );
}

export const filterCategories: Record<SEARCH_CATEGORY_ID, SearchCategory> = {
  [SEARCH_CATEGORY_ID.NAVIGATION]: {
    title: "Navigate",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORY_ID.NAVIGATION,
    desc: createMessage(NAV_DESCRIPTION),
  },
  [SEARCH_CATEGORY_ID.ACTION_OPERATION]: {
    title: "Create New",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORY_ID.ACTION_OPERATION,
    desc: createMessage(ACTION_OPERATION_DESCRIPTION),
  },
  [SEARCH_CATEGORY_ID.SNIPPETS]: {
    title: "Use Snippets",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORY_ID.SNIPPETS,
    desc: createMessage(SNIPPET_DESCRIPTION),
  },
  [SEARCH_CATEGORY_ID.DOCUMENTATION]: {
    title: "Search Documentation",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORY_ID.DOCUMENTATION,
    desc: createMessage(DOC_DESCRIPTION),
  },
  [SEARCH_CATEGORY_ID.INIT]: {
    id: SEARCH_CATEGORY_ID.INIT,
  },
};

export const isNavigation = (category: SearchCategory) =>
  category.id === SEARCH_CATEGORY_ID.NAVIGATION;
export const isDocumentation = (category: SearchCategory) =>
  category.id === SEARCH_CATEGORY_ID.DOCUMENTATION;
export const isSnippet = (category: SearchCategory) =>
  category.id === SEARCH_CATEGORY_ID.SNIPPETS;
export const isMenu = (category: SearchCategory) =>
  category.id === SEARCH_CATEGORY_ID.INIT;
export const isActionOperation = (category: SearchCategory) =>
  category.id === SEARCH_CATEGORY_ID.ACTION_OPERATION;

export const getFilterCategoryList = () =>
  Object.values(filterCategories).filter((cat: SearchCategory) => {
    return cat.show ? cat.show() : true;
  });

export type SearchItem = DocSearchItem | Datasource | any;

// todo better checks here?
export const getItemType = (item: SearchItem): SEARCH_ITEM_TYPES => {
  let type: SEARCH_ITEM_TYPES;
  if (item.widgetName) type = SEARCH_ITEM_TYPES.widget;
  else if (
    item.kind === SEARCH_ITEM_TYPES.document ||
    item.kind === SEARCH_ITEM_TYPES.page ||
    item.kind === SEARCH_ITEM_TYPES.sectionTitle ||
    item.kind === SEARCH_ITEM_TYPES.placeholder ||
    item.kind === SEARCH_ITEM_TYPES.category ||
    item.kind === SEARCH_ITEM_TYPES.actionOperation
  )
    type = item.kind;
  else if (item.config?.pluginType === PluginType.JS)
    type = SEARCH_ITEM_TYPES.jsAction;
  else if (item.config?.name) type = SEARCH_ITEM_TYPES.action;
  else if (item.body?.snippet) type = SEARCH_ITEM_TYPES.snippet;
  else type = SEARCH_ITEM_TYPES.datasource;
  return type;
};

export const getItemTitle = (item: SearchItem): string => {
  const type = getItemType(item);

  switch (type) {
    case SEARCH_ITEM_TYPES.action:
    case SEARCH_ITEM_TYPES.jsAction:
      return item?.config?.name;
    case SEARCH_ITEM_TYPES.widget:
      return item?.widgetName;
    case SEARCH_ITEM_TYPES.datasource:
      return item?.name;
    case SEARCH_ITEM_TYPES.page:
      return item?.pageName;
    case SEARCH_ITEM_TYPES.sectionTitle:
    case SEARCH_ITEM_TYPES.placeholder:
    case SEARCH_ITEM_TYPES.document:
      return item?.title;
    case SEARCH_ITEM_TYPES.snippet:
      return item.title;
    case SEARCH_ITEM_TYPES.actionOperation:
      return item.title;
    default:
      return "";
  }
};

export const getItemPage = (item: SearchItem): string => {
  const type = getItemType(item);

  switch (type) {
    case SEARCH_ITEM_TYPES.action:
    case SEARCH_ITEM_TYPES.jsAction:
      return item?.config?.pageId;
    case SEARCH_ITEM_TYPES.widget:
    case SEARCH_ITEM_TYPES.page:
      return item?.pageId;
    default:
      return "";
  }
};

// Helper function to keep calling
// github fetch until either number
// of retries is over or the content
// is succesfully fetched
export const fetchDefaultDocs = async (
  updateIsFetching: (b: boolean) => void,
  setDefaultDocs: (t: DocSearchItem[]) => void,
  retries: number,
  maxRetries: number,
) => {
  if (maxRetries <= retries) {
    updateIsFetching(false);
    return;
  }
  updateIsFetching(true);
  try {
    const data = await fetchRawGithubContentList();
    setDefaultDocs(data);
    updateIsFetching(false);
  } catch (e) {
    updateIsFetching(false);
    // We don't want to fetch
    // immediately to avoid
    // same error again
    setTimeout(
      () =>
        fetchDefaultDocs(
          updateIsFetching,
          setDefaultDocs,
          retries + 1,
          maxRetries,
        ),
      500 * maxRetries,
    );
  }
};

export const useDefaultDocumentationResults = (modalOpen: boolean) => {
  const [defaultDocs, setDefaultDocs] = useState<DocSearchItem[]>([]);
  const [isFetching, updateIsFetching] = useState(false);
  useEffect(() => {
    if (!isFetching && !defaultDocs.length) {
      // Keep trying to fetch until a max retries is reached
      fetchDefaultDocs(updateIsFetching, setDefaultDocs, 0, 2);
    }
  }, [modalOpen]);

  return defaultDocs;
};

export const algoliaHighlightTag = "ais-highlight-0000000000";

export const attachKind = (source: any[], kind: string) => {
  return source.map((s) => ({
    ...s,
    kind,
  }));
};

export const getEntityId = (entity: {
  entityType: FocusEntity;
  [key: string]: any;
}) => {
  const { entityType } = entity;
  switch (entityType) {
    case FocusEntity.DATASOURCE:
      return entity.id;
    case FocusEntity.API:
    case FocusEntity.QUERY:
    case FocusEntity.JS_OBJECT:
      return entity.config?.id;
    case FocusEntity.PROPERTY_PANE:
      return entity.widgetId;
    case FocusEntity.CANVAS:
    case FocusEntity.PAGE:
      return entity.pageId;
    case FocusEntity.NONE:
      break;
  }
};

export type ActionOperation = {
  title: string;
  desc: string;
  icon?: any;
  kind: SEARCH_ITEM_TYPES;
  action?: (pageId: string, location: EventLocation) => any;
  redirect?: (pageId: string, from: EventLocation) => any;
  pluginId?: string;
};

export const actionOperations: ActionOperation[] = [
  {
    title: "New Blank API",
    desc: "Create a new API",
    kind: SEARCH_ITEM_TYPES.actionOperation,
    action: (pageId: string, location: EventLocation) =>
      createNewApiAction(pageId, location),
  },
  {
    title: "New Blank GraphQL API",
    desc: "Create a new API",
    icon: <GraphQLIconV2 />,
    kind: SEARCH_ITEM_TYPES.actionOperation,
    action: (pageId: string, location: EventLocation) =>
      createNewApiAction(pageId, location, PluginPackageName.GRAPHQL),
  },
  {
    title: "New JS Object",
    desc: "Create a new JS Object",
    kind: SEARCH_ITEM_TYPES.actionOperation,
    icon: JsFileIconV2(),
    action: (pageId: string, from: EventLocation) =>
      createNewJSCollection(pageId, from),
  },
  {
    title: "New cURL Import",
    desc: "Import a cURL Request",
    kind: SEARCH_ITEM_TYPES.actionOperation,
    icon: <CurlIconV2 />,
    redirect: (pageId: string, from: EventLocation) => {
      const queryParams = getQueryParams();
      const curlImportURL = curlImportPageURL({
        pageId,
        params: {
          from,
          ...queryParams,
        },
      });
      history.push(curlImportURL);
    },
  },
];

export const isMatching = (text = "", query = "") => {
  if (typeof text === "string" && typeof query === "string") {
    return text.toLowerCase().indexOf(query.toLowerCase()) > -1;
  }
  return false;
};
