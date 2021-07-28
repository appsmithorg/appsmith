import { DocSearchItem } from "./utils";

export const defaultDocsConfig = [
  {
    link:
      "https://raw.githubusercontent.com/appsmithorg/appsmith-docs/v1.2.1/tutorials/building-a-store-catalog-manager/README.md",
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

export const fetchRawGithubContentList = async () => {
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
  if (data) {
    return data;
  }
  return [];
};
