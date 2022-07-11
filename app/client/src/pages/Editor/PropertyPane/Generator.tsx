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
import Boxed from "../GuidedTour/Boxed";
import { GUIDED_TOUR_STEPS } from "../GuidedTour/constants";
import Fuse from "fuse.js";
import { IconNames } from "@blueprintjs/icons";
import { Icon, IconSize } from "components/ads";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const EmptySearchResultWrapper = styled.div`
  color: ${Colors.GRAY_700};

  svg {
    fill: ${Colors.GRAY_400};
  }
`;

export enum PropertyPaneGroup {
  CONTENT,
  STYLE,
}

export type PropertyControlsGeneratorProps = {
  id: string;
  group?: PropertyPaneGroup;
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
  let config: Readonly<PropertyPaneConfig[]>;
  switch (props.group) {
    case PropertyPaneGroup.CONTENT:
      config = WidgetFactory.getWidgetPropertyPaneContentConfig(props.type);
      break;
    case PropertyPaneGroup.STYLE:
      config = WidgetFactory.getWidgetPropertyPaneStyleConfig(props.type);
      break;
    default:
      config = WidgetFactory.getWidgetPropertyPaneConfig(props.type);
  }

  const fuse = new Fuse(config, {
    includeMatches: true,
    keys: ["children.label"],
    threshold: 0.5,
    location: 0,
    distance: 100,
  });

  let res = config;
  if (props.searchQuery && props.searchQuery !== "") {
    const results = fuse.search(props.searchQuery);
    const searchResults: PropertyPaneConfig[] = [];
    for (const result of results) {
      if (result.item.children && result.matches) {
        const children = [];
        for (const match of result.matches) {
          if (match.key === "children.label" && match.refIndex !== undefined) {
            children.push(result.item.children[match.refIndex]);
          }
        }
        searchResults.push({
          ...result.item,
          children,
        });
      }
    }
    res = searchResults;
  }

  return props.searchQuery &&
    props.searchQuery.length > 0 &&
    res.length === 0 ? (
    <EmptySearchResult />
  ) : (
    <>{generatePropertyControl(res as readonly PropertyPaneConfig[], props)}</>
  );
}

export default PropertyControlsGenerator;
