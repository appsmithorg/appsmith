import type { IPanelProps } from "@blueprintjs/core";
import type {
  PropertyPaneConfig,
  PropertyPaneControlConfig,
  PropertyPaneSectionConfig,
} from "constants/PropertyControlConstants";
import type { WidgetType } from "constants/WidgetConstants";
import React from "react";
import PropertyControl from "./PropertyControl";
import PropertySection from "./PropertySection";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { EmptySearchResult } from "./EmptySearchResult";
import { useSelector } from "react-redux";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { searchPropertyPaneConfig } from "./propertyPaneSearch";
import { evaluateHiddenProperty } from "./helpers";
import type { EnhancementFns } from "selectors/widgetEnhancementSelectors";
import { getWidgetEnhancementSelector } from "selectors/widgetEnhancementSelectors";
import equal from "fast-deep-equal/es6";

export interface PropertyControlsGeneratorProps {
  id: string;
  config: readonly PropertyPaneConfig[];
  type: WidgetType;
  panel: IPanelProps;
  panelPropertyPath?: string;
  isPanelProperty?: boolean;
  theme: EditorTheme;
  searchQuery?: string;
}

const generatePropertyControl = (
  propertyPaneConfig: readonly PropertyPaneConfig[],
  props: PropertyControlsGeneratorProps,
  isSearchResult: boolean,
  enhancements: EnhancementFns,
) => {
  if (!propertyPaneConfig) return null;
  return propertyPaneConfig.map((config: PropertyPaneConfig) => {
    if ((config as PropertyPaneSectionConfig).sectionName) {
      const sectionConfig: PropertyPaneSectionConfig =
        config as PropertyPaneSectionConfig;
      return (
        <PropertySection
          childrenId={sectionConfig.childrenId}
          collapsible={sectionConfig.collapsible ?? true}
          hidden={sectionConfig.hidden}
          id={config.id || sectionConfig.sectionName}
          isDefaultOpen={sectionConfig.isDefaultOpen}
          key={config.id + props.id}
          name={sectionConfig.sectionName}
          panelPropertyPath={props.panelPropertyPath}
          propertyPath={sectionConfig.propertySectionPath}
          tag={sectionConfig.tag}
        >
          {config.children &&
            generatePropertyControl(
              config.children,
              props,
              isSearchResult,
              enhancements,
            )}
        </PropertySection>
      );
    } else if ((config as PropertyPaneControlConfig).controlType) {
      return (
        <PropertyControl
          isPanelProperty={!!props.isPanelProperty}
          key={config.id + props.id}
          {...(config as PropertyPaneControlConfig)}
          enhancements={enhancements}
          isSearchResult={isSearchResult}
          panel={props.panel}
          theme={props.theme}
        />
      );
    }
    throw Error("Unknown configuration provided: " + props.type);
  });
};

function PropertyControlsGenerator(props: PropertyControlsGeneratorProps) {
  const widgetProps: any = useSelector(getWidgetPropsForPropertyPane);

  const enhancementSelector = getWidgetEnhancementSelector(
    widgetProps?.widgetId,
  );
  const enhancements = useSelector(enhancementSelector, equal);

  if (!widgetProps) return null;

  const finalProps = evaluateHiddenProperty(
    props.config,
    widgetProps,
    enhancements?.enhancementFns?.shouldHidePropertyFn,
  );

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
        enhancements,
      )}
    </>
  );
}

export default PropertyControlsGenerator;
