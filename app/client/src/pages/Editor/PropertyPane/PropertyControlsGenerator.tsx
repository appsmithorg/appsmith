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
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { isAirgapped } from "ee/utils/airgapHelpers";

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

export const shouldSectionBeExpanded = (
  sectionConfig: PropertyPaneSectionConfig,
  isFlagEnabled: boolean,
) => {
  if (isFlagEnabled && "expandedByDefault" in sectionConfig)
    return !!sectionConfig.expandedByDefault;

  if ("isDefaultOpen" in sectionConfig) return sectionConfig.isDefaultOpen;

  return true;
};

const generatePropertyControl = (
  propertyPaneConfig: readonly PropertyPaneConfig[],
  props: PropertyControlsGeneratorProps,
  isSearchResult: boolean,
  enhancements: EnhancementFns,
  isCollapseAllExceptDataEnabled: boolean,
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
          isDefaultOpen={shouldSectionBeExpanded(
            sectionConfig,
            isCollapseAllExceptDataEnabled,
          )}
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
              isCollapseAllExceptDataEnabled,
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetProps: any = useSelector(getWidgetPropsForPropertyPane);

  const isCollapseAllExceptDataEnabledFlag: boolean = useFeatureFlag(
    FEATURE_FLAG.ab_learnability_discoverability_collapse_all_except_data_enabled,
  );

  const isCollapseAllExceptDataEnabled = isAirgapped()
    ? true
    : isCollapseAllExceptDataEnabledFlag;

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
        isCollapseAllExceptDataEnabled,
      )}
    </>
  );
}

export default PropertyControlsGenerator;
