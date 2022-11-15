import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";

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

function search(config: PropertyPaneSectionConfig[], searchQuery: string) {
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
  for (const conf of config) {
    const section: any = { ...conf, children: [] };
    const sectionName = conf.sectionName.toLowerCase();
    let isPropertyStartsWith = false;
    if (sectionName.startsWith(query)) {
      searchResult.section.startsWith.push(conf);
    } else if (sectionName.includes(query)) {
      searchResult.section.contains.push(conf);
    } else {
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
      for (const child of conf.children) {
        if ((child as PropertyPaneControlConfig).label) {
          const label = (child as PropertyPaneControlConfig).label.toLowerCase();
          if (label.startsWith(query)) {
            isEmpty = false;
            isPropertyStartsWith = true;
            childResult.property.startsWith.push(child);
          } else if (label.includes(query)) {
            isEmpty = false;
            childResult.property.contains.push(child);
          }
        } else {
          // Solve for nested section
          const result = search([child as PropertyPaneSectionConfig], query);

          // matches the section name
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
        section.children = sortSearchResult(childResult);
        if (isPropertyStartsWith) {
          searchResult.property.startsWith.push(section);
        } else {
          searchResult.property.contains.push(section);
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

export function searchProperty(
  config: PropertyPaneSectionConfig[],
  searchQuery?: string,
) {
  if (!searchQuery) return config;
  const searchResult = search(config, searchQuery);
  return sortSearchResult(searchResult);
}
