import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { useState } from "react";

export function useSearchText(initialVal: string) {
  const [searchText, setSearchText] = useState(initialVal);

  const debouncedSetSearchText = debounce(
    (text) => {
      setSearchText(text.trim());
    },
    250,
    {
      maxWait: 1000,
    },
  );

  return { searchText, setSearchText: debouncedSetSearchText };
}

export function searchProperty(
  config: readonly PropertyPaneConfig[],
  searchQuery?: string,
) {
  if (!searchQuery) return config;

  const fuseConfig = {
    threshold: 0.5,
    location: 0,
    distance: 20,
    keys: ["children.label", "label", "children.children.label"],
  };
  const fuse = new Fuse(config, fuseConfig);
  const searchResults = fuse.search(searchQuery).map((result) => {
    const res = { ...result };
    if (result.children)
      res.children = searchProperty(
        result.children,
        searchQuery,
      ) as PropertyPaneConfig[];

    return res;
  });
  return searchResults;
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
