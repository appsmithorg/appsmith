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
    includeMatches: true,
    keys: ["sectionName", "children.label", "label", "children.children.label"],
  };
  const fuse = new Fuse(config, fuseConfig);
  const searchResults = fuse.search(searchQuery) as FuseResultWithMatches<
    PropertyPaneConfig
  >[];

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

  return res;
}

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
