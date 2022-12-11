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
import { EmptySearchResult } from "./EmptySearchResult";
import { useSelector } from "react-redux";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { searchPropertyPaneConfig } from "./propertyPaneSearch";
import { evaluateHiddenProperty } from "./helpers";

export type PropertyControlsGeneratorProps = {
  id: string;
  config: readonly PropertyPaneConfig[];
  type: WidgetType;
  panel: IPanelProps;
  panelPropertyPath?: string;
  isPanelProperty?: boolean;
  theme: EditorTheme;
  searchQuery?: string;
};

const generatePropertyControl = (
  propertyPaneConfig: readonly PropertyPaneConfig[],
  props: PropertyControlsGeneratorProps,
  isSearchResult: boolean,
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
            childrenId={sectionConfig.childrenId}
            collapsible={sectionConfig.collapsible ?? true}
            hidden={sectionConfig.hidden}
            id={config.id || sectionConfig.sectionName}
            isDefaultOpen={sectionConfig.isDefaultOpen}
            name={sectionConfig.sectionName}
            panelPropertyPath={props.panelPropertyPath}
            propertyPath={sectionConfig.propertySectionPath}
            tag={sectionConfig.tag}
          >
            {config.children &&
              generatePropertyControl(config.children, props, isSearchResult)}
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
            isPanelProperty={!!props.isPanelProperty}
            key={config.id + props.id}
            {...(config as PropertyPaneControlConfig)}
            isSearchResult={isSearchResult}
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
  const widgetProps: any = useSelector(getWidgetPropsForPropertyPane);
  if (!widgetProps) return null;
  const finalProps = evaluateHiddenProperty(props.config, widgetProps);
  const searchResults = searchPropertyPaneConfig(
    finalProps as PropertyPaneSectionConfig[],
    props.searchQuery,
  );

  const isSearchResultEmpty = searchResults.length === 0;
  const isSearchResult = finalProps !== searchResults;

  return isSearchResultEmpty ? (
    <EmptySearchResult />
  ) : (
    <>
      {generatePropertyControl(
        searchResults as readonly PropertyPaneConfig[],
        props,
        isSearchResult,
      )}
    </>
  );
}

export default PropertyControlsGenerator;
