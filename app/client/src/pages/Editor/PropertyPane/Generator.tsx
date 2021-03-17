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
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

export type PropertyControlsGeneratorProps = {
  type: WidgetType;
  panel: IPanelProps;
  theme: EditorTheme;
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
          theme={props.theme}
        />
      );
    }
    throw Error("Unknown configuration provided: " + props.type);
  });
};

export const PropertyControlsGenerator = (
  props: PropertyControlsGeneratorProps,
) => {
  const config = WidgetFactory.getWidgetPropertyPaneConfig(props.type);
  return (
    <>
      {generatePropertyControl(config as readonly PropertyPaneConfig[], props)}
    </>
  );
};

export default PropertyControlsGenerator;
