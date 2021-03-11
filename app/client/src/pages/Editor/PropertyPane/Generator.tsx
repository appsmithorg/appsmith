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

export type PropertyControlsGeneratorProps = {
  type: WidgetType;
  panel: IPanelProps;
};

export const generatePropertyControl = (
  propertyPaneConfig: readonly PropertyPaneConfig[],
  props: PropertyControlsGeneratorProps,
) => {
  if (!propertyPaneConfig) return null;
  return propertyPaneConfig.map((config: PropertyPaneConfig) => {
    if ((config as PropertyPaneSectionConfig).sectionName) {
      const sectionConfig: PropertyPaneSectionConfig = config as PropertyPaneSectionConfig;
      return (
        <PropertySection
          hidden={sectionConfig.hidden}
          id={config.id || sectionConfig.sectionName}
          isDefaultOpen
          key={config.id}
          name={sectionConfig.sectionName}
          propertyPath={sectionConfig.propertySectionPath}
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

export function PropertyControlsGenerator(
  props: PropertyControlsGeneratorProps,
) {
  const config = WidgetFactory.getWidgetPropertyPaneConfig(props.type);
  return (
    <>
      {generatePropertyControl(config as readonly PropertyPaneConfig[], props)}
    </>
  );
}

export default PropertyControlsGenerator;
