import { Datasource } from "entities/Datasource";
import { useEffect, useState } from "react";

export type RecentEntity = {
  type: string;
  id: string;
  params?: Record<string, string | undefined>;
};

export enum SEARCH_ITEM_TYPES {
  document = "document",
  action = "action",
  widget = "widget",
  datasource = "datasource",
  page = "page",
  sectionTitle = "sectionTitle",
  placeholder = "placeholder",
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
  else if (
    item.kind === SEARCH_ITEM_TYPES.document ||
    item.kind === SEARCH_ITEM_TYPES.page ||
    item.kind === SEARCH_ITEM_TYPES.sectionTitle ||
    item.kind === SEARCH_ITEM_TYPES.placeholder
  )
    type = item.kind;
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
    case SEARCH_ITEM_TYPES.sectionTitle:
      return item?.title;
    case SEARCH_ITEM_TYPES.placeholder:
      return item?.title;
    default:
      return "";
  }
};

const defaultDocsConfig = [
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

const githubDocsAssetsPath =
  "https://raw.githubusercontent.com/appsmithorg/appsmith-docs/v1.2.1/.gitbook";

export const useDefaultDocumentationResults = () => {
  const [defaultDocs, setDefaultDocs] = useState<DocSearchItem[]>([]);

  useEffect(() => {
    (async () => {
      const data = await Promise.all(
        defaultDocsConfig.map(async (doc: any) => {
          const response = await fetch(doc.link);
          let document = await response.text();
          const assetRegex = new RegExp("[../]*?/.gitbook", "g");
          document = document.replace(assetRegex, githubDocsAssetsPath);
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
      setDefaultDocs(data);
    })();
  }, []);

  return defaultDocs;
};

export const algoliaHighlightTag = "ais-highlight-0000000000";

export const attachKind = (source: any[], kind: string) => {
  return source.map((s) => ({
    ...s,
    kind,
  }));
};
