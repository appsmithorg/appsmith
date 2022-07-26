import React from "react";
import { compact, map, sortBy } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import WidgetFactory, { DerivedPropertiesMap } from "utils/WidgetFactory";

import AutoLayoutContainerComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";
import { JustifyContent, LayoutDirection } from "components/constants";
import { ContainerStyle } from "widgets/ContainerWidget/component";

class AutoLayoutContainerWidget extends BaseWidget<
  AutoLayoutContainerWidgetProps<WidgetProps>,
  WidgetState
> {
  constructor(props: AutoLayoutContainerWidgetProps<any>) {
    super(props);
    this.state = {
      contextValue: {
        useAutoLayout: false,
        direction: LayoutDirection.Horizontal,
        JustifyContent: JustifyContent.FlexStart,
        overflow: "wrap",
      },
    };
    this.renderChildWidget = this.renderChildWidget.bind(this);
  }

  static getPropertyPaneConfig() {
    return [
      {
        propertyName: "useAutoLayout",
        label: "Use Auto Layout",
        controlType: "SWITCH",
        defaultValue: true,
        helpText: "Controls layout of children widgets",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
      {
        sectionName: "Layout Controls",
        hidden: (props: AutoLayoutContainerWidgetProps<WidgetProps>): boolean =>
          !props?.useAutoLayout,
        children: [
          {
            helpText: "Controls the direction of layout",
            propertyName: "direction",
            label: "Direction",
            controlType: "DROP_DOWN",
            defaultValue: LayoutDirection.Horizontal,
            options: [
              { label: "Horizontal", value: LayoutDirection.Horizontal },
              { label: "Vertical", value: LayoutDirection.Vertical },
            ],
            isJSConvertible: false,
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Controls alignment of the content",
            propertyName: "justifyContent",
            label: "Align content",
            controlType: "DROP_DOWN",
            defaultValue: JustifyContent.FlexStart,
            options: [
              { label: "Flex start", value: JustifyContent.FlexStart },
              { label: "Center", value: JustifyContent.Center },
              { label: "Space around", value: JustifyContent.SpaceAround },
              { label: "Space between", value: JustifyContent.SpaceBetween },
              { label: "Space evently", value: JustifyContent.SpaceEvenly },
            ],
            isJSConvertible: false,
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
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
          {
            helpText: "Enables scrolling for content inside the widget",
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Styles",
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
          {
            helpText: "Enter value for border width",
            propertyName: "borderWidth",
            label: "Border Width",
            placeholderText: "Enter value in px",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.NUMBER },
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

  // componentDidUpdate(prevProps: AutoLayoutContainerWidgetProps<WidgetProps>): void {
  //   if (prevProps.)
  // }

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    // For now, isVisible prop defines whether to render a detached widget
    if (childWidgetData.detachFromLayout && !childWidgetData.isVisible) {
      return null;
    }

    const { componentHeight, componentWidth } = this.getComponentDimensions();

    childWidgetData.rightColumn = componentWidth;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? childWidgetData.bottomRow
      : componentHeight;
    childWidgetData.minHeight = componentHeight;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;

    childWidgetData.parentId = this.props.widgetId;
    // Pass layout controls to children
    childWidgetData.useAutoLayout = this.props.useAutoLayout;
    childWidgetData.direction = this.props.direction;
    childWidgetData.justifyContent = this.props.justifyContent;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  }

  renderChildren = () => {
    return map(
      // sort by row so stacking context is correct
      // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
      // Figure out a way in which the stacking context is consistent.
      sortBy(compact(this.props.children), (child) => child.topRow),
      this.renderChildWidget,
    );
  };

  renderAsContainerComponent(
    props: AutoLayoutContainerWidgetProps<WidgetProps>,
  ) {
    return (
      <AutoLayoutContainerComponent {...props}>
        {/* without the wrapping div onClick events are triggered twice */}
        <>{this.renderChildren()}</>
      </AutoLayoutContainerComponent>
    );
  }

  getPageView() {
    return this.renderAsContainerComponent(this.props);
  }

  static getWidgetType(): string {
    return "AUTOLAYOUTCONTAINER_WIDGET";
  }
}

export interface AutoLayoutContainerWidgetProps<T extends WidgetProps>
  extends WidgetProps {
  children?: T[];
  containerStyle?: ContainerStyle;
  shouldScrollContents?: boolean;
  noPad?: boolean;
}

export default AutoLayoutContainerWidget;
