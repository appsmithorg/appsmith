import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import Fuse, { FuseResultWithMatches } from "fuse.js";
import { debounce } from "lodash";
import { useCallback, useState } from "react";

export function useSearchText(initialVal: string) {
  const [searchText, setSearchText] = useState(initialVal);

  const debouncedSetSearchText = useCallback(
    debounce(
      (text) => {
        setSearchText(text.trim());
      },
      250,
      {
        maxWait: 1000,
      },
    ),
    [setSearchText],
  );

  return { searchText, setSearchText: debouncedSetSearchText };
}

export function searchProperty(
  config: readonly PropertyPaneConfig[],
  searchQuery?: string,
) {
  if (!searchQuery) return config;

  const fuseConfig = {
    threshold: 0.2,
    distance: 100,
    location: 0,
    includeMatches: true,
    keys: ["sectionName", "children.label", "label", "children.children.label"],
    includeScore: true,
    // useExtendedSearch: true,
    // keys: [
    //   { name: "sectionName", weight: 0.1 },
    //   { name: "children.label", weight: 0.3 },
    //   { name: "label", weight: 0.3 },
    //   { name: "children.children.label", weight: 0.3 },
    // ],
    // ignoreFieldNorm: true,
    // sortFn: (a: { score: number }, b: { score: number }) => {
    //   console.log("bla sort", a, b);
    //   return a.score - b.score;
    // },
  };
  const fuse = new Fuse(config, fuseConfig);
  const searchResults = fuse.search(searchQuery) as FuseResultWithMatches<
    PropertyPaneConfig
  >[];

  console.log("bla searchRes", searchResults);

  const res = [];
  for (const result of searchResults) {
    const x = { ...result.item };
    const isSectionNameMatch =
      result.matches.findIndex((x: any) => x.key === "sectionName") >= 0;
    if (!isSectionNameMatch && x.children) {
      x.children = searchProperty(
        x.children,
        searchQuery,
      ) as PropertyPaneConfig[];
    }
    res.push(x);
  }

  console.log("bla searchRe2", searchResults);

  return res;
}

// export function searchProperty(
//   config: readonly PropertyPaneConfig[],
//   searchQuery?: string,
// ) {
//   if (!searchQuery) return config;

//   const startsWithResults = [];
//   const containsResults = [];

//   for (const conf of config) {
//     if ((conf as PropertyPaneSectionConfig).sectionName) {
//       const sectionName = (conf as PropertyPaneSectionConfig).sectionName.toLowerCase();
//       if (sectionName.startsWith(searchQuery)) {
//         startsWithResults.push(conf);
//       } else if (sectionName.includes(searchQuery)) {
//         containsResults.push(conf);
//       } else {
//         const children: any =
//           searchProperty(conf.children || [], searchQuery) || [];
//         if (children.length > 0) {
//           containsResults.push({ ...conf, children });
//         }
//       }
//     } else if ((conf as PropertyPaneControlConfig).label) {
//       const label = (conf as PropertyPaneControlConfig).label.toLowerCase();
//       if (label.startsWith(searchQuery)) {
//         startsWithResults.push(conf);
//       } else if (label.includes(searchQuery)) {
//         containsResults.push(conf);
//       }
//     }
//   }

//   return [...startsWithResults, ...containsResults];
// }

export function updateConfigPaths(
  config: PropertyPaneConfig[],
  basePath: string,
) {
  return config.map((_childConfig) => {
    const childConfig = Object.assign({}, _childConfig);
    // TODO(abhinav): Figure out a better way to differentiate between section and control
    if (
      (childConfig as PropertyPaneSectionConfig).sectionName &&
      childConfig.children
    ) {
      (childConfig as PropertyPaneSectionConfig).propertySectionPath = basePath;
      childConfig.children = updateConfigPaths(childConfig.children, basePath);
    } else {
      (childConfig as PropertyPaneControlConfig).propertyName = `${basePath}.${
        (childConfig as PropertyPaneControlConfig).propertyName
      }`;
    }
    return childConfig;
  });
}
