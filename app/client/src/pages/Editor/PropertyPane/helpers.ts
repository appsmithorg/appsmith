import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
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

export function evaluateHiddenProperty(
  config: readonly PropertyPaneConfig[],
  widgetProps: any,
) {
  const finalConfig: PropertyPaneConfig[] = [];
  for (const conf of config) {
    const sectionConfig = conf as PropertyPaneSectionConfig;
    const controlConfig = conf as PropertyPaneControlConfig;
    if (sectionConfig.sectionName) {
      const isSectionHidden =
        sectionConfig.hidden &&
        sectionConfig.hidden(
          widgetProps,
          sectionConfig.propertySectionPath || "",
        );
      if (!isSectionHidden) {
        const children = evaluateHiddenProperty(
          sectionConfig.children,
          widgetProps,
        );
        if (children.length > 0) {
          finalConfig.push({
            ...sectionConfig,
            childrenId: children.map((configItem) => configItem.id).join(""),
            children,
          });
        }
      }
    } else if (controlConfig.controlType) {
      const isControlHidden =
        controlConfig.hidden &&
        controlConfig.hidden(widgetProps, controlConfig.propertyName);
      if (!isControlHidden) {
        finalConfig.push(conf);
      }
    }
  }
  return finalConfig;
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
