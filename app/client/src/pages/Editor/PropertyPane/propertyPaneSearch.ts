import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { debounce } from "lodash";
import AnalyticsUtil from "utils/AnalyticsUtil";

interface SearchResultType {
  section: {
    startsWith: PropertyPaneConfig[];
    contains: PropertyPaneConfig[];
  };
  property: {
    startsWith: PropertyPaneConfig[];
    contains: PropertyPaneConfig[];
  };
}

interface PropertyPaneSearchAnalytics {
  widgetType: string;
  searchText: string;
  widgetName: string;
  searchPath: string;
}

export const sendPropertyPaneSearchAnalytics = debounce(
  (param: PropertyPaneSearchAnalytics) => {
    if (param.searchText !== "")
      AnalyticsUtil.logEvent("WIDGET_PROPERTY_SEARCH", param);
  },
  1000,
);

function tokenSearch(text: string, searchQuery: string) {
  const noMatch = {
    startsWith: false,
    contains: false,
  };
  if (!text) return noMatch;
  // RegEx escaping taken from: https://github.com/tc39/proposal-regex-escaping/blob/main/polyfill.js
  const escapedSearchQuery = searchQuery.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
  const regEx = new RegExp(`\\b${escapedSearchQuery}.*\\b`, "i");
  let matchPosition = text.search(regEx);
  if (matchPosition < 0) {
    // if no match found, see if it matches by splitting the camel case properties such as 'onClick'
    const caseBreakdown = text.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    matchPosition = caseBreakdown.search(regEx);
  }
  if (matchPosition === 0) {
    return {
      startsWith: true,
      contains: false,
    };
  } else if (matchPosition > 0) {
    return {
      startsWith: false,
      contains: true,
    };
  }
  return noMatch;
}

function computeChildrenIdAndInsertSection(
  configArray: PropertyPaneConfig[],
  ...sectionConfig: PropertyPaneSectionConfig[]
) {
  configArray.push(
    ...sectionConfig.map((section) => {
      if (section.childrenId)
        return {
          ...section,
          childrenId: section.children.map((child) => child.id).join(""),
        };
      return section;
    }),
  );
}

function search(
  sectionConfigs: PropertyPaneSectionConfig[],
  searchQuery: string,
) {
  const query = searchQuery.toLowerCase();
  const searchResult: SearchResultType = {
    section: {
      startsWith: [],
      contains: [],
    },
    property: {
      startsWith: [],
      contains: [],
    },
  };
  for (const sectionConfig of sectionConfigs) {
    const sectionConfigCopy: PropertyPaneSectionConfig = {
      ...sectionConfig,
      children: [],
    };
    const sectionName = sectionConfig.sectionName;
    let isPropertyStartsWith = false;
    const sectionNameMatch = tokenSearch(sectionName, query);
    if (sectionNameMatch.startsWith) {
      computeChildrenIdAndInsertSection(
        searchResult.section.startsWith,
        sectionConfig,
      );
    } else if (sectionNameMatch.contains) {
      computeChildrenIdAndInsertSection(
        searchResult.section.contains,
        sectionConfig,
      );
    } else if (sectionConfig.children) {
      // search through properties
      const childResult: SearchResultType = {
        section: {
          startsWith: [],
          contains: [],
        },
        property: {
          startsWith: [],
          contains: [],
        },
      };
      let isEmpty = true;
      for (const child of sectionConfig.children) {
        if ((child as PropertyPaneControlConfig).invisible) {
          continue;
        }
        if ((child as PropertyPaneControlConfig).label) {
          const label = (child as PropertyPaneControlConfig).label;
          const labelMatch = tokenSearch(label, query);
          if (labelMatch.startsWith) {
            isEmpty = false;
            isPropertyStartsWith = true;
            childResult.property.startsWith.push(child);
          } else if (labelMatch.contains) {
            isEmpty = false;
            childResult.property.contains.push(child);
          }
        } else {
          // search through nested section
          const result = search([child as PropertyPaneSectionConfig], query);
          if (result.section.startsWith.length > 0) {
            isEmpty = false;
            isPropertyStartsWith = true;
            childResult.section.startsWith.push(...result.section.startsWith);
          }
          if (result.section.contains.length > 0) {
            isEmpty = false;
            isPropertyStartsWith = false;
            childResult.section.contains.push(...result.section.contains);
          }
          if (result.property.startsWith.length > 0) {
            isEmpty = false;
            isPropertyStartsWith = true;
            childResult.property.startsWith.push(...result.property.startsWith);
          }
          if (result.property.contains.length > 0) {
            isEmpty = false;
            isPropertyStartsWith = false;
            childResult.property.contains.push(...result.property.contains);
          }
        }
      }
      if (!isEmpty) {
        sectionConfigCopy.children = sortSearchResult(childResult);
        if (isPropertyStartsWith) {
          computeChildrenIdAndInsertSection(
            searchResult.property.startsWith,
            sectionConfigCopy,
          );
        } else {
          computeChildrenIdAndInsertSection(
            searchResult.property.contains,
            sectionConfigCopy,
          );
        }
      }
    }
  }
  return searchResult;
}

function sortSearchResult(searchResult: SearchResultType) {
  return [
    ...searchResult.section.startsWith,
    ...searchResult.property.startsWith,
    ...searchResult.section.contains,
    ...searchResult.property.contains,
  ];
}

export function searchPropertyPaneConfig(
  config: PropertyPaneSectionConfig[],
  searchQuery?: string,
) {
  if (!searchQuery) return config;
  const searchResult = search(config, searchQuery);
  return sortSearchResult(searchResult);
}
