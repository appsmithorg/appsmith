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
  type: WidgetType,
): PropertyPaneConfig[] | undefined => {
  return WidgetFactory.propertyPaneConfigsMap.get(type);
};

export type PropertyControlsGeneratorProps = {
  type: WidgetType;
  panel: IPanelProps;
};

export const generatePropertyControl = (
  propertyPaneConfig: PropertyPaneConfig[],
  props: PropertyControlsGeneratorProps,
) => {
  if (!propertyPaneConfig) return null;
  return propertyPaneConfig.map((config: PropertyPaneConfig) => {
    if ((config as PropertyPaneSectionConfig).sectionName) {
      const sectionConfig: PropertyPaneSectionConfig = config as PropertyPaneSectionConfig;
      return (
        <PropertySection
          key={config.id}
          id={config.id || sectionConfig.sectionName}
          name={sectionConfig.sectionName}
          hidden={sectionConfig.hidden}
          propertyPath={sectionConfig.propertySectionPath}
          isDefaultOpen
        >
          {config.children && generatePropertyControl(config.children, props)}
        </PropertySection>
      );
    } else if ((config as PropertyPaneControlConfig).controlType) {
      return (
        <PropertyControl
          key={config.id}
          {...(config as PropertyPaneControlConfig)}
          panel={props.panel}
        />
      );
    }
    throw Error("Unknown configuration provided: " + props.type);
  });
};

export const PropertyControlsGenerator = (
  props: PropertyControlsGeneratorProps,
) => {
  const config = getPropertyPaneConfig(props.type);
  return <>{generatePropertyControl(config as PropertyPaneConfig[], props)}</>;
};

export default PropertyControlsGenerator;
