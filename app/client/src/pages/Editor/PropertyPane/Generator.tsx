import { IPanelProps } from "@blueprintjs/core";
import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { WidgetType } from "constants/WidgetConstants";
import React from "react";
import PropertyControl from "./PropertyControl";
import PropertySection from "./PropertySection";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import Boxed from "../GuidedTour/Boxed";
import { GUIDED_TOUR_STEPS } from "../GuidedTour/constants";
import { IconNames } from "@blueprintjs/icons";
import { Icon, IconSize } from "components/ads";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { searchProperty } from "./helpers";

const EmptySearchResultWrapper = styled.div`
  color: ${Colors.GRAY_700};

  svg {
    fill: ${Colors.GRAY_400};
  }
`;

export type PropertyControlsGeneratorProps = {
  id: string;
  config: readonly PropertyPaneConfig[];
  type: WidgetType;
  panel: IPanelProps;
  theme: EditorTheme;
  searchQuery?: string;
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
          key={config.id + props.id}
          show={
            sectionConfig.sectionName !== "General" &&
            props.type === "TABLE_WIDGET"
          }
          step={GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING}
        >
          <PropertySection
            collapsible={sectionConfig.collapsible ?? true}
            hidden={sectionConfig.hidden}
            id={config.id || sectionConfig.sectionName}
            isDefaultOpen={sectionConfig.isDefaultOpen}
            key={config.id + props.id + props.searchQuery}
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
          key={config.id + props.id}
          show={
            (config as PropertyPaneControlConfig).propertyName !==
              "tableData" && props.type === "TABLE_WIDGET"
          }
          step={GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING}
        >
          <PropertyControl
            key={config.id + props.id}
            {...(config as PropertyPaneControlConfig)}
            panel={props.panel}
            theme={props.theme}
          />
        </Boxed>
      );
    }
    throw Error("Unknown configuration provided: " + props.type);
  });
};

function EmptySearchResult() {
  return (
    <EmptySearchResultWrapper className="mt-12 p-3">
      <Icon
        className="flex justify-center"
        name={IconNames.SEARCH}
        size={IconSize.XXXL}
      />
      <p className="pt-3 text-center">
        No Properties found based on your search
      </p>
    </EmptySearchResultWrapper>
  );
}

export function PropertyControlsGenerator(
  props: PropertyControlsGeneratorProps,
) {
  const config = searchProperty(props.config, props.searchQuery);

  return props.searchQuery &&
    props.searchQuery.length > 0 &&
    config.length === 0 ? (
    <EmptySearchResult />
  ) : (
    <>
      {generatePropertyControl(config as readonly PropertyPaneConfig[], props)}
    </>
  );
}

export default PropertyControlsGenerator;
