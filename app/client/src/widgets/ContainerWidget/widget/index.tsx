import React from "react";

import ContainerComponent, { ContainerStyle } from "../component";
import WidgetFactory, { DerivedPropertiesMap } from "utils/WidgetFactory";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";

import { VALIDATION_TYPES } from "constants/WidgetValidation";
import WidgetsMultiSelectBox from "pages/Editor/WidgetsMultiSelectBox";
import { CanvasSelectionArena } from "pages/common/CanvasSelectionArena";

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
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
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

    return WidgetFactory.createWidget(props);
  }

  renderChildren = () => {
    console.log(
      "Connected Widgets, Rendering Canvas/Container Children",
      this.props.children,
    );
    return this.props.children?.map(this.renderChildWidget);
    // return map(
    //   // sort by row so stacking context is correct
    //   // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
    //   // Figure out a way in which the stacking context is consistent.
    //   sortBy(compact(this.props.children), (child) => child.topRow),
    //   this.renderChildWidget,
    // );
  };

  renderAsContainerComponent(props: ContainerWidgetProps<WidgetProps>) {
    return (
      <ContainerComponent {...props}>
        {this.props.widgetId === MAIN_CONTAINER_WIDGET_ID && (
          <CanvasSelectionArena widgetId={MAIN_CONTAINER_WIDGET_ID} />
        )}
        <WidgetsMultiSelectBox
          widgetId={this.props.widgetId}
          widgetType={this.props.type}
        />
        {/* without the wrapping div onClick events are triggered twice */}
        <>{this.renderChildren()}</>
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
  noPad?: boolean;
}

export default ContainerWidget;
