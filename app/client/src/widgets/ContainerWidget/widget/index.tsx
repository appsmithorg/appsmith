import React from "react";
import { map, sortBy, compact } from "lodash";

import ContainerComponent, { ContainerStyle } from "../component";
import WidgetFactory, { DerivedPropertiesMap } from "utils/WidgetFactory";

import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import { getSnapSpaces, getWidgetDimensions } from "widgets/WidgetUtils";
import produce from "immer";

class ContainerWidget extends BaseWidget<
  ContainerWidgetProps<WidgetProps>,
  WidgetState
> {
  constructor(props: ContainerWidgetProps<WidgetProps>) {
    super(props);
    this.renderChildWidget = this.renderChildWidget.bind(this);
  }

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Use a html color name, HEX, RGB or RGBA value",
            placeholderText: "#FFFFFF / Gray / rgb(255, 99, 71)",
            propertyName: "backgroundColor",
            label: "Background Color",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "shouldScrollContents",
            label: "Scroll Contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
        ],
      },
    ];
  }

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return BASE_WIDGET_VALIDATION;
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

  renderChildWidget(props: WidgetProps): React.ReactNode {
    // For now, isVisible prop defines whether to render a detached widget
    if (props.detachFromLayout && !props.isVisible) {
      return null;
    }

    const snapSpaces = getSnapSpaces(this.props);
    const { componentWidth, componentHeight } = getWidgetDimensions(this.props);

    const childWidgetProps = produce(props, (childWidgetData) => {
      if (childWidgetData.type !== "CANVAS_WIDGET") {
        childWidgetData.parentColumnSpace = snapSpaces.snapColumnSpace;
        childWidgetData.parentRowSpace = snapSpaces.snapRowSpace;
      } else {
        // This is for the detached child like the default CANVAS_WIDGET child

        childWidgetData.rightColumn = componentWidth;
        childWidgetData.bottomRow = this.props.shouldScrollContents
          ? childWidgetData.bottomRow
          : componentHeight;
        childWidgetData.minHeight = componentHeight;
        childWidgetData.isVisible = this.props.isVisible;
        childWidgetData.shouldScrollContents = false;
        childWidgetData.canExtend = this.props.shouldScrollContents;
      }
    });

    // childWidgetData.parentId = this.props.widgetId;

    return WidgetFactory.createWidget(childWidgetProps);
  }

  renderChildren = () => {
    console.log("Connected Widgets, Rendering Children", this.props.children);
    return map(
      // sort by row so stacking context is correct
      // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
      // Figure out a way in which the stacking context is consistent.
      sortBy(compact(this.props.children), (child) => child.topRow),
      this.renderChildWidget,
    );
  };

  renderAsContainerComponent(props: ContainerWidgetProps<WidgetProps>) {
    return (
      <ContainerComponent {...props}>
        {this.renderChildren()}
      </ContainerComponent>
    );
  }

  render() {
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
}

export default ContainerWidget;
