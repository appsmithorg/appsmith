import type { WidgetCallout } from "WidgetProvider/constants";
import WidgetFactory from "WidgetProvider/factory";
import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { Callout } from "@appsmith/ads";
import { debounce } from "lodash";
import React, { useCallback, useState } from "react";
import { layoutSystemBasedPropertyFilter } from "sagas/WidgetEnhancementHelpers";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import type { WidgetProps } from "widgets/BaseWidget";

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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const links = callout.links?.map((link) => {
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

/**
 * saves property value incase it is a reusable property in the session storage so that we can re-use
 * the property value when we create widget on drop.
 *
 * Note: these values that we are storing will be used in widgetAddtionSaga to hydrate the widget properties when
 * we create widget on drop
 */
export function savePropertyInSessionStorageIfRequired(props: {
  isReusable: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  widgetProperties: any;
  propertyName: string;
  propertyValue: string;
  parentWidgetId?: string;
  parentWidgetType?: string;
}) {
  const {
    isReusable,
    parentWidgetId,
    parentWidgetType,
    propertyName,
    propertyValue,
    widgetProperties,
  } = props;

  if (isReusable && isDynamicValue(propertyValue) === false) {
    let widgetType = widgetProperties.type;
    let widgetPropertyName = propertyName;

    // in case of type is WDS_ICON_BUTTON_WIDGET, we need to use key WDS_BUTTON_WIDGET, reason being
    // we want to reuse the property values of icon button for button as well when we create button widget on drop
    if (widgetType === "WDS_ICON_BUTTON_WIDGET") {
      widgetType = "WDS_BUTTON_WIDGET";
    }

    // in case of type is WDS_INLINE_BUTTONS_WIDGET, we want to just store the property that is being changed, not the whole property path
    if (widgetType === "WDS_INLINE_BUTTONS_WIDGET") {
      widgetPropertyName = propertyName.split(".").pop() as string;
    }

    // if case of type is ZONE_WIDGET, we need to store the property value with parent widget id as well
    // parent id is required because we want to hydrate value of property of the new zone widget only if the parent widget is same
    if (widgetType === "ZONE_WIDGET") {
      if (!(parentWidgetType && parentWidgetId)) {
        return;
      }

      widgetPropertyName = `${parentWidgetId}.${widgetPropertyName}`;
    }

    sessionStorage.setItem(
      `${widgetType}.${widgetPropertyName}`,
      propertyValue,
    );
  }
}
