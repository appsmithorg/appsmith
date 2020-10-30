import { IPanelProps } from "@blueprintjs/core";
import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { WidgetType } from "constants/WidgetConstants";
import React from "react";
import WidgetFactory from "utils/WidgetFactory";
import PropertyControl from "./PropertyControl";
import PropertySection from "./PropertySection";

const getPropertyPaneConfig = (
  props: any,
): PropertyPaneConfig[] | undefined => {
  return WidgetFactory.propertyPaneConfigsMap.get(props.type as WidgetType);
};

export type PropertyControlsGeneratorProps = {
  type: WidgetType;
  panel: IPanelProps;
};

export const generatePropertyControl = (
  propertyPaneConfig: PropertyPaneConfig[],
  props: any,
  onPropertyChange?: (propertyName: string, propertyValue: any) => void,
) => {
  if (!propertyPaneConfig) return null;
  return propertyPaneConfig.map((config: PropertyPaneConfig) => {
    if ((config as PropertyPaneSectionConfig).sectionName) {
      // Do not render the section if it needs to be hidden
      if (config.hidden && config.hidden(props)) {
        return null;
      }
      return (
        <PropertySection
          key={config.id}
          name={(config as PropertyPaneSectionConfig).sectionName}
          isDefaultOpen
        >
          {config.children &&
            generatePropertyControl(config.children, props, onPropertyChange)}
        </PropertySection>
      );
    } else if ((config as PropertyPaneControlConfig).controlType) {
      return (
        <PropertyControl
          key={config.id}
          {...(config as PropertyPaneControlConfig)}
          widgetProperties={props}
          panel={props.panel}
          onPropertyChange={onPropertyChange}
        />
      );
    }
    throw Error("Unknown configuration provided: " + props.type);
  });
};

export const PropertyControlsGenerator = (
  props: PropertyControlsGeneratorProps,
) => {
  const config = getPropertyPaneConfig(props);
  return <>{generatePropertyControl(config as PropertyPaneConfig[], props)}</>;
};

export default PropertyControlsGenerator;
