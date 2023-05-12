import type { MouseEventHandler } from "react";
import React from "react";

import type { DerivedPropertiesMap } from "utils/WidgetFactory";
import WidgetFactory from "utils/WidgetFactory";
import type { ContainerStyle } from "../component";
import ContainerComponent from "../component";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";

import { ValidationTypes } from "constants/WidgetValidation";
import { compact, map, sortBy } from "lodash";
import WidgetsMultiSelectBox from "pages/Editor/WidgetsMultiSelectBox";

import type { Stylesheet } from "entities/AppTheming";
import { Positioning } from "utils/autoLayout/constants";
import { getSnappedGrid } from "sagas/WidgetOperationUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  isAutoHeightEnabledForWidget,
  DefaultAutocompleteDefinitions,
  isAutoHeightEnabledForWidgetWithLimits,
} from "widgets/WidgetUtils";
import type { AutocompletionDefinitions } from "widgets/constants";
import { getCanvasSplittingConfig } from "utils/autoLayout/canvasSplitProperties";
import type { CanvasSplitTypes } from "utils/autoLayout/canvasSplitProperties";
import { CanvasSplitResizer } from "../component/canvasSplitResizer";

export class ContainerWidget extends BaseWidget<
  ContainerWidgetProps<WidgetProps>,
  WidgetState
> {
  constructor(props: ContainerWidgetProps<WidgetProps>) {
    super(props);
    this.renderChildWidget = this.renderChildWidget.bind(this);
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Containers are used to group widgets together to form logical higher order widgets. Containers let you organize your page better and move all the widgets inside them together.",
      "!url": "https://docs.appsmith.com/widget-reference/container",
      backgroundColor: {
        "!type": "string",
        "!url": "https://docs.appsmith.com/widget-reference/container",
      },
      isVisible: DefaultAutocompleteDefinitions.isVisible,
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Enables scrolling for content inside the widget",
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Layout",
        children: [getCanvasSplittingConfig()],
      },
      {
        sectionName: "Color",
        children: [
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "backgroundColor",
            label: "Background Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "borderColor",
            label: "Border Color",
            controlType: "COLOR_PICKER",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and Shadow",
        children: [
          {
            helpText: "Enter value for border width",
            propertyName: "borderWidth",
            label: "Border Width",
            placeholderText: "Enter value in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
            postUpdateAction: ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
          },
          {
            propertyName: "borderRadius",
            label: "Border Radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "boxShadow",
            label: "Box Shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }
  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }
  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
  }

  getSnapSpaces = () => {
    const { componentWidth } = this.getComponentDimensions();
    const { snapGrid } = getSnappedGrid(this.props, componentWidth);

    return snapGrid;
  };

  renderChildWidget(
    childWidgetData: WidgetProps,
    index?: number,
  ): React.ReactNode {
    const childWidget = { ...childWidgetData };

    const { componentHeight, componentWidth } = this.getComponentDimensions();
    const canvasSplitRatio: number =
      this.props.canvasSplitType && index !== undefined && !this.props.isMobile
        ? this.props.ratios[index]
        : 1;
    childWidget.rightColumn =
      index === undefined || index === 1
        ? componentWidth
        : componentWidth * canvasSplitRatio;
    if (index !== undefined && index === 1) {
      if (!this.props.isMobile)
        childWidget.leftColumn = componentWidth * (1 - canvasSplitRatio);
      else childWidget.leftColumn = 0;
    }
    childWidget.bottomRow = this.props.shouldScrollContents
      ? childWidget.bottomRow
      : componentHeight;
    childWidget.minHeight = componentHeight;
    childWidget.shouldScrollContents = false;
    childWidget.canExtend = this.props.shouldScrollContents;

    childWidget.parentId = this.props.widgetId;
    // Pass layout controls to children
    childWidget.positioning =
      childWidget?.positioning || this.props.positioning;
    childWidget.useAutoLayout = this.props.positioning
      ? this.props.positioning === Positioning.Vertical
      : false;
    childWidget.canvasSplitRatio = canvasSplitRatio;
    childWidget.isSecondCanvas = index === 1;
    childWidget.canvasWidth = componentWidth * canvasSplitRatio;

    return WidgetFactory.createWidget(childWidget, this.props.renderMode);
  }

  renderChildren = () => {
    return map(
      // sort by row so stacking context is correct
      // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
      // Figure out a way in which the stacking context is consistent.
      this.props.positioning !== Positioning.Fixed
        ? this.props.children
        : sortBy(compact(this.props.children), (child) => child.topRow),
      this.renderChildWidget,
    );
  };

  renderAsContainerComponent(props: ContainerWidgetProps<WidgetProps>) {
    const isAutoHeightEnabled: boolean =
      isAutoHeightEnabledForWidget(this.props) &&
      !isAutoHeightEnabledForWidgetWithLimits(this.props) &&
      this.props.positioning !== Positioning.Vertical;

    const shouldRenderResizer =
      this.props.ratios &&
      this.props.positioning === Positioning.Vertical &&
      !this.props.isMobile &&
      this.props.canvasSplitType === "2-column-custom" &&
      this.props.isSelected &&
      this.props.children &&
      this.props.children.length === 2;

    const [firstCanvas, secondCanvas] =
      this.props.children?.map((canvas) => canvas.widgetId) || [];

    const { componentWidth } = this.getComponentDimensions();
    const canvasSplitRatio: number =
      this.props.canvasSplitType && !this.props.isMobile
        ? this.props.ratios[0]
        : 1;

    const firstCanvasWidth = componentWidth * canvasSplitRatio;

    return (
      <>
        <ContainerComponent
          {...props}
          isMobile={this.props.isMobile || false}
          noScroll={isAutoHeightEnabled}
        >
          <WidgetsMultiSelectBox
            {...this.getSnapSpaces()}
            noContainerOffset={!!props.noContainerOffset}
            widgetId={this.props.widgetId}
            widgetType={this.props.type}
          />
          {/* without the wrapping div onClick events are triggered twice */}
          <>{this.renderChildren()}</>
        </ContainerComponent>
        {shouldRenderResizer && (
          <CanvasSplitResizer
            firstCanvas={firstCanvas}
            firstCanvasWidth={firstCanvasWidth}
            parentId={this.props.widgetId}
            secondCanvas={secondCanvas}
          />
        )}
      </>
    );
  }

  getPageView() {
    return this.renderAsContainerComponent(this.props);
  }

  static getWidgetType(): string {
    return "CONTAINER_WIDGET";
  }
}

export interface ContainerWidgetProps<T extends WidgetProps>
  extends WidgetProps {
  children?: T[];
  containerStyle?: ContainerStyle;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onClickCapture?: MouseEventHandler<HTMLDivElement>;
  shouldScrollContents?: boolean;
  noPad?: boolean;
  positioning?: Positioning;
  canvasSplit?: boolean;
  canvasWidth?: number;
  canvasSplitType?: CanvasSplitTypes;
}

export default ContainerWidget;
