import { IPanelProps } from "@blueprintjs/core";
import {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import { WidgetType } from "constants/WidgetConstants";
import React, { useEffect, useRef, useState } from "react";
import PropertyControl from "./PropertyControl";
import PropertySection from "./PropertySection";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import Boxed from "../GuidedTour/Boxed";
import { GUIDED_TOUR_STEPS } from "../GuidedTour/constants";
import { searchProperty } from "./helpers";
import { EmptySearchResult } from "./EmptySearchResult";

export enum PropertyPaneGroup {
  CONTENT,
  STYLE,
}

export type PropertyControlsGeneratorProps = {
  id: string;
  config: readonly PropertyPaneConfig[];
  type: WidgetType;
  panel: IPanelProps;
  theme: EditorTheme;
  searchQuery?: string;
};

type SectionProps = {
  sectionConfig: PropertyPaneSectionConfig;
  config: PropertyPaneConfig;
  generatorProps: PropertyControlsGeneratorProps;
};

function Section(props: SectionProps) {
  const { config, generatorProps, sectionConfig } = props;
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (sectionRef.current?.childElementCount === 0) {
      // Fix issue where the section is not hidden when it has no children
      setHidden(true);
    }
  }, [generatorProps.searchQuery]);

  return hidden ? null : (
    <Boxed
      key={config.id + generatorProps.id}
      show={
        sectionConfig.sectionName !== "General" &&
        generatorProps.type === "TABLE_WIDGET"
      }
      step={GUIDED_TOUR_STEPS.TABLE_WIDGET_BINDING}
    >
      <PropertySection
        childrenWrapperRef={sectionRef}
        collapsible={sectionConfig.collapsible ?? true}
        hidden={sectionConfig.hidden}
        id={config.id || sectionConfig.sectionName}
        isDefaultOpen={sectionConfig.isDefaultOpen}
        key={config.id + generatorProps.id + generatorProps.searchQuery}
        name={sectionConfig.sectionName}
        propertyPath={sectionConfig.propertySectionPath}
      >
        {config.children &&
          generatePropertyControl(config.children, generatorProps)}
      </PropertySection>
    </Boxed>
  );
}

const generatePropertyControl = (
  propertyPaneConfig: readonly PropertyPaneConfig[],
  props: PropertyControlsGeneratorProps,
) => {
  if (!propertyPaneConfig) return null;
  return propertyPaneConfig.map((config: PropertyPaneConfig) => {
    if ((config as PropertyPaneSectionConfig).sectionName) {
      const sectionConfig: PropertyPaneSectionConfig = config as PropertyPaneSectionConfig;
      return (
        <Section
          config={config}
          generatorProps={props}
          key={config.id + props.id}
          sectionConfig={sectionConfig}
        />
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

function PropertyControlsGenerator(props: PropertyControlsGeneratorProps) {
  const searchResults = searchProperty(props.config, props.searchQuery);

  const isSearchResultEmpty =
    props.searchQuery &&
    props.searchQuery.length > 0 &&
    searchResults.length === 0;

  return isSearchResultEmpty ? (
    <EmptySearchResult />
  ) : (
    <>
      {generatePropertyControl(
        searchResults as readonly PropertyPaneConfig[],
        props,
      )}
    </>
  );
}

export default PropertyControlsGenerator;
