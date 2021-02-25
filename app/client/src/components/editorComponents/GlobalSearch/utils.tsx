import { Datasource } from "entities/Datasource";

export enum SEARCH_ITEM_TYPES {
  documentation = "documentation",
  action = "action",
  widget = "widget",
  datasource = "datasource",
  page = "page",
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

export type SearchItem = DocSearchItem | Datasource | any;

// todo better checks here?
export const getItemType = (item: SearchItem): SEARCH_ITEM_TYPES => {
  let type: SEARCH_ITEM_TYPES;
  if (item.widgetName) type = SEARCH_ITEM_TYPES.widget;
  else if (item.kind === "document") type = SEARCH_ITEM_TYPES.documentation;
  else if (item.kind === SEARCH_ITEM_TYPES.page) type = SEARCH_ITEM_TYPES.page;
  else if (item.config?.name) type = SEARCH_ITEM_TYPES.action;
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
    default:
      return "";
  }
};

const defaultDocs = [
  {
    link:
      "https://raw.githubusercontent.com/appsmithorg/appsmith-docs/v1.2.1/tutorial-1/README.md",
    title: "Tutorial",
    path: "master/tutorial-1",
    kind: "document",
  },
  {
    link:
      "https://raw.githubusercontent.com/appsmithorg/appsmith-docs/v1.2.1/core-concepts/connecting-to-data-sources/README.md",
    title: "Connecting to Data Sources",
    path: "master/core-concepts/connecting-to-data-sources",
    kind: "document",
  },
  {
    link:
      "https://raw.githubusercontent.com/appsmithorg/appsmith-docs/v1.2.1/core-concepts/displaying-data-read/README.md",
    title: "Displaying Data (Read)",
    path: "master/core-concepts/displaying-data-read",
    kind: "document",
  },
  {
    link:
      "https://raw.githubusercontent.com/appsmithorg/appsmith-docs/v1.2.1/core-concepts/writing-code/README.md",
    title: "Writing Code",
    path: "master/core-concepts/writing-code",
    kind: "document",
  },
];

export const getDefaultDocumentationResults = async () => {
  const data = await Promise.all(
    defaultDocs.map(async (doc) => {
      const response = await fetch(doc.link);
      const document = await response.text();
      return {
        _highlightResult: {
          document: {
            value: document,
          },
          title: {
            value: doc.title,
          },
        },
        ...doc,
      } as DocSearchItem;
    }),
  );

  return data;
};

export const algoliaHighlightTag = "ais-highlight-0000000000";

export const attachKind = (source: any[], kind: string) => {
  return source.map((s) => ({
    ...s,
    kind,
  }));
};
