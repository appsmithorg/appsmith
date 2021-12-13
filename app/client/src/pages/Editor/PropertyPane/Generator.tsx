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
import Indicator from "../GuidedTour/Indicator";
import Boxed from "../GuidedTour/Boxed";

export type PropertyControlsGeneratorProps = {
  id: string;
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
        <Boxed
          show={
            sectionConfig.sectionName !== "General" &&
            props.type === "TABLE_WIDGET"
          }
          step={3}
        >
          <PropertySection
            hidden={sectionConfig.hidden}
            id={config.id || sectionConfig.sectionName}
            isDefaultOpen
            key={config.id + props.id}
            name={sectionConfig.sectionName}
            propertyPath={sectionConfig.propertySectionPath}
          >
            {config.children && generatePropertyControl(config.children, props)}
          </PropertySection>
        </Boxed>
      );
    } else if ((config as PropertyPaneControlConfig).controlType) {
      return (
        <Boxed
          show={
            (config as PropertyPaneControlConfig).propertyName !==
              "tableData" && props.type === "TABLE_WIDGET"
          }
          step={3}
        >
          <Indicator
            location="PROPERTY_CONTROL"
            modifiers={{
              offset: {
                enabled: true,
                options: {
                  offset: [-15, -50],
                },
              },
            }}
            position={"top"}
            show={
              (config as PropertyPaneControlConfig).propertyName === "tableData"
            }
            step={3}
            targetTagName="div"
          >
            <PropertyControl
              key={config.id + props.id}
              {...(config as PropertyPaneControlConfig)}
              panel={props.panel}
              theme={props.theme}
            />
          </Indicator>
        </Boxed>
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
