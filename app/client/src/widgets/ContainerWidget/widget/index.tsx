import React from "react";

import {
  CONTAINER_GRID_PADDING,
  FLEXBOX_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
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
import { getResponsiveLayoutConfig } from "utils/layoutPropertiesUtils";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  isAutoHeightEnabledForWidget,
  isAutoHeightEnabledForWidgetWithLimits,
} from "widgets/WidgetUtils";

export class ContainerWidget extends BaseWidget<
  ContainerWidgetProps<WidgetProps>,
  WidgetState
> {
  constructor(props: ContainerWidgetProps<WidgetProps>) {
    super(props);
    this.renderChildWidget = this.renderChildWidget.bind(this);
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
      ...getResponsiveLayoutConfig(this.getWidgetType()),
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
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
    // For all widgets inside a container, we remove both container padding as well as widget padding from component width
    let padding = (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2;
    if (
      this.props.widgetId === MAIN_CONTAINER_WIDGET_ID ||
      this.props.type === "CONTAINER_WIDGET"
    ) {
      //For MainContainer and any Container Widget padding doesn't exist coz there is already container padding.
      padding =
        this.props.positioning === Positioning.Vertical
          ? FLEXBOX_PADDING * 2
          : CONTAINER_GRID_PADDING * 2;
    }
    if (this.props.noPad) {
      // Widgets like ListWidget choose to have no container padding so will only have widget padding
      padding = WIDGET_PADDING * 2;
    }
    let width = componentWidth;
    width -= padding;
    return {
      snapRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      snapColumnSpace: componentWidth
        ? width / GridDefaults.DEFAULT_GRID_COLUMNS
        : 0,
    };
  };

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    const childWidget = { ...childWidgetData };

    const { componentHeight, componentWidth } = this.getComponentDimensions();

    childWidget.rightColumn = componentWidth;
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
    const useAutoLayout = this.props.positioning
      ? this.props.positioning === Positioning.Vertical
      : false;
    const isAutoHeightEnabled: boolean =
      isAutoHeightEnabledForWidget(this.props) &&
      !isAutoHeightEnabledForWidgetWithLimits(this.props) &&
      !useAutoLayout;
    return (
      <ContainerComponent {...props} noScroll={isAutoHeightEnabled}>
        <WidgetsMultiSelectBox
          {...this.getSnapSpaces()}
          noContainerOffset={!!props.noContainerOffset}
          widgetId={this.props.widgetId}
          widgetType={this.props.type}
        />
        {/* without the wrapping div onClick events are triggered twice */}
        <>{this.renderChildren()}</>
      </ContainerComponent>
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
  shouldScrollContents?: boolean;
  noPad?: boolean;
  positioning?: Positioning;
}

export default ContainerWidget;
