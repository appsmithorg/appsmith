import React, { Suspense } from "react";
import Skeleton from "components/utils/Skeleton";
import ContainerWidget from "../../ContainerWidget";
import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { DynamicContainerWidgetProps } from "../constants";
import {
  DYNAMIC_CONTAINER_CLASS,
  DynamicContainerLayoutNames,
  DynamicContainerLayouts,
} from "../constants";
import styled, { css } from "styled-components";
import DynamicContainerComponent from "../component";
import { POSITIONED_WIDGET } from "constants/componentClassNameConstants";

const DynamicContainerCanvasWrapper = styled.div<{
  previewLayoutInCanvas: boolean;
}>`
  .canvas-mode-legend {
    position: absolute;
    left: 2rem;
    top: 2rem;
    z-index: 1000;
  }

  ${(props) =>
    props.previewLayoutInCanvas &&
    css`
      .${DYNAMIC_CONTAINER_CLASS} {
        > *.${POSITIONED_WIDGET} {
          > div > .resize-wrapper {
            width: 100% !important;
            height: 100% !important;
          }
        }
      }
    `}
`;

class DynamicContainerWidget extends ContainerWidget<DynamicContainerWidgetProps> {
  /**
   * Returning any due to {@link ContainerWidget.getPropertyPaneContentConfig} type.
   */
  static getPropertyPaneContentConfig(): any[] {
    const options = Object.entries(DynamicContainerLayoutNames).map(
      ([value, label]) => ({ label, value }),
    );
    const config: PropertyPaneConfig[] = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "layout",
            label: "Layout",
            controlType: "DROP_DOWN",
            helpText: "Select layout",
            options,
            isBindProperty: true,
            isJSConvertible: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: Object.values(DynamicContainerLayouts),
                default: DynamicContainerLayouts["50_50"],
              },
            },
          },
          {
            helpText:
              "Enable is you want to preview the layout. (confirm text)",
            propertyName: "previewLayoutInCanvas",
            label: "Preview Layout in Edit mode",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
            isJSConvertible: false,
          },
        ],
      },
    ];
    return config;
  }

  // static getPropertyPaneConfig() {
  //   return super.getPropertyPaneContentConfig();
  // }

  // static getPropertyPaneStyleConfig() {
  //   return [];
  // }

  // static getDerivedPropertiesMap(): DerivedPropertiesMap {
  //   return {};
  // }

  // static getDefaultPropertiesMap(): Record<string, string> {
  //   return {};
  // }

  // static getMetaPropertiesMap(): Record<string, any> {
  //   return {};
  // }
  getCanvasView(): React.ReactNode {
    return (
      <DynamicContainerCanvasWrapper
        previewLayoutInCanvas={this.props.previewLayoutInCanvas}
      >
        <p className="canvas-mode-legend">Runtime might look different.</p>
        {super.getCanvasView()}
      </DynamicContainerCanvasWrapper>
    );
  }

  getPageView() {
    return (
      <Suspense fallback={<Skeleton />}>
        <DynamicContainerComponent
          {...this.props}
          // layout={this.props.layout}
          // previewLayoutInCanvas={this.props.previewLayoutInCanvas}
          // renderMode={this.props.renderMode}
        >
          {super.getPageView()}
        </DynamicContainerComponent>
      </Suspense>
    );
  }

  static getWidgetType(): string {
    return "DYNAMICCONTAINER_WIDGET";
  }
}

export default DynamicContainerWidget;
