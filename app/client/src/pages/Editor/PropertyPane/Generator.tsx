import { WidgetType } from "constants/WidgetConstants";
import React from "react";
import WidgetFactory from "utils/WidgetFactory";
import PropertyControl from "./PropertyControl";
import PropertySection from "./PropertySection";

const getPropertyPaneConfig = (props: any) => {
  const configGenerator = WidgetFactory.propertyPaneConfigsMap.get(
    props.type as WidgetType,
  );
  return configGenerator && configGenerator(props);
};

export type PropertyControlsGeneratorProps = {
  type: WidgetType;
};

const generatePropertyControl = (config: any, props: any) => {
  if (!config) return null;
  if (config.sectionName) {
    return (
      <PropertySection
        key={config.id}
        name={config.sectionName}
        isDefaultOpen={config.isDefaultOpen}
      >
        {config.children.map((childConfig: any) =>
          generatePropertyControl(childConfig, props),
        )}
      </PropertySection>
    );
  } else if (config.controlType) {
    return (
      <PropertyControl
        key={config.id}
        propertyConfig={config}
        widgetProperties={props}
      />
    );
  }
  throw Error("Unknown configuration provided: " + props.type);
};

export const PropertyControlsGenerator = (
  props: PropertyControlsGeneratorProps,
) => {
  const config = getPropertyPaneConfig(props);
  return generatePropertyControl(config, props);
};

export default PropertyControlsGenerator;
