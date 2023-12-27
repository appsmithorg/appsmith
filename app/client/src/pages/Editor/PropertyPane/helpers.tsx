import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { debounce } from "lodash";
import { useCallback, useState } from "react";
import { layoutSystemBasedPropertyFilter } from "sagas/WidgetEnhancementHelpers";
import type { WidgetProps } from "widgets/BaseWidget";
import { Callout } from "design-system";
import React from "react";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetCallout } from "WidgetProvider/constants";

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
  shouldHidePropertyFn?: (propertyName: string) => boolean | undefined,
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
          shouldHidePropertyFn,
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
        layoutSystemBasedPropertyFilter(
          widgetProps,
          controlConfig.propertyName,
        ) ||
        (controlConfig.hidden &&
          controlConfig.hidden(widgetProps, controlConfig.propertyName)) ||
        (shouldHidePropertyFn &&
          shouldHidePropertyFn(controlConfig.propertyName));
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

export function renderWidgetCallouts(props: WidgetProps): JSX.Element[] {
  const { getEditorCallouts } = WidgetFactory.getWidgetMethods(props.type);
  if (getEditorCallouts) {
    const callouts: WidgetCallout[] = getEditorCallouts(props);
    return callouts.map((callout, index) => {
      const links = callout.links.map((link) => {
        return {
          children: link.text,
          to: link.url,
        };
      });
      return (
        <Callout
          data-testid="t--deprecation-warning"
          key={index}
          kind="warning"
          links={links}
        >
          {callout.message}
        </Callout>
      );
    });
  } else {
    return [];
  }
}
