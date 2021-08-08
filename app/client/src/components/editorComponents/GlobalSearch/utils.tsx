import { Datasource } from "entities/Datasource";
import { useEffect, useState } from "react";
import { fetchRawGithubContentList } from "./githubHelper";

export type RecentEntity = {
  type: string;
  id: string;
  params?: Record<string, string | undefined>;
};

export enum SEARCH_CATEGORY_ID {
  SNIPPETS = "Snippets",
  DOCUMENTATION = "Documentation",
  NAVIGATION = "Navigate",
  INIT = "",
}

export enum SEARCH_ITEM_TYPES {
  document = "document",
  action = "action",
  widget = "widget",
  datasource = "datasource",
  page = "page",
  sectionTitle = "sectionTitle",
  placeholder = "placeholder",
  category = "category",
  snippet = "snippet",
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

export type SearchCategory = {
  id: SEARCH_CATEGORY_ID;
  kind?: SEARCH_ITEM_TYPES;
  title?: string;
  desc?: string;
};

export const filterCategories: Record<SEARCH_CATEGORY_ID, SearchCategory> = {
  [SEARCH_CATEGORY_ID.NAVIGATION]: {
    title: "Navigate",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORY_ID.NAVIGATION,
    desc: "Navigate to any page, widget or file across this project.",
  },
  [SEARCH_CATEGORY_ID.SNIPPETS]: {
    title: "Use Snippets",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORY_ID.SNIPPETS,
    desc: "Search and Insert code snippets to perform complex actions quickly.",
  },
  [SEARCH_CATEGORY_ID.DOCUMENTATION]: {
    title: "Search Documentation",
    kind: SEARCH_ITEM_TYPES.category,
    id: SEARCH_CATEGORY_ID.DOCUMENTATION,
    desc: "Search and Insert code snippets to perform complex actions quickly.",
  },
  [SEARCH_CATEGORY_ID.INIT]: {
    id: SEARCH_CATEGORY_ID.INIT,
  },
};

export const getFilterCategoryList = () => Object.values(filterCategories);

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
    item.kind === SEARCH_ITEM_TYPES.category
  )
    type = item.kind;
  else if (item.kind === SEARCH_ITEM_TYPES.page) type = SEARCH_ITEM_TYPES.page;
  else if (item.config?.name) type = SEARCH_ITEM_TYPES.action;
  else if (item.body?.snippet) type = SEARCH_ITEM_TYPES.snippet;
  else type = SEARCH_ITEM_TYPES.datasource;

  return type;
};

export const getItemTitle = (item: SearchItem): string => {
  const type = getItemType(item);

  switch (type) {
    case SEARCH_ITEM_TYPES.action:
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
    default:
      return "";
  }
};

export const getItemPage = (item: SearchItem): string => {
  const type = getItemType(item);

  switch (type) {
    case SEARCH_ITEM_TYPES.action:
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

export const getEntityId = (entity: any) => {
  const { entityType } = entity;
  switch (entityType) {
    case "page":
      return entity.pageId;
    case "datasource":
      return entity.id;
    case "widget":
      return entity.widgetId;
    case "action":
      return entity.config?.id;
  }
};
