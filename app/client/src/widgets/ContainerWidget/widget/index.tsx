import React from "react";
import { map, sortBy, compact } from "lodash";

import ContainerComponent, { ContainerStyle } from "../component";
import WidgetFactory, { DerivedPropertiesMap } from "utils/WidgetFactory";
import {
  GridDefaults,
  CONTAINER_GRID_PADDING,
  WIDGET_PADDING,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";

import BaseWidget, { WidgetProps, WidgetState } from "../../BaseWidget";

import { getSnapSpaces, getWidgetDimensions } from "widgets/WidgetUtils";
import produce from "immer";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
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
  getSnapSpaces = () => {
    const { componentWidth } = getWidgetDimensions(this.props);
    // For all widgets inside a container, we remove both container padding as well as widget padding from component width
    let padding = (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2;
    if (
      this.props.widgetId === MAIN_CONTAINER_WIDGET_ID ||
      this.props.type === "CONTAINER_WIDGET"
    ) {
      //For MainContainer and any Container Widget padding doesn't exist coz there is already container padding.
      padding = CONTAINER_GRID_PADDING * 2;
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

  renderChildWidget(props: WidgetProps): React.ReactNode {
    // For now, isVisible prop defines whether to render a detached widget
    if (props.detachFromLayout && !props.isVisible) {
      return null;
    }

    const snapSpaces = getSnapSpaces(this.props);
    const { componentHeight, componentWidth } = getWidgetDimensions(this.props);

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

  /*const { componentHeight, componentWidth } = this.getComponentDimensions();

    childWidgetData.rightColumn = componentWidth;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? childWidgetData.bottomRow
      : componentHeight;
    childWidgetData.minHeight = componentHeight;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;

    childWidgetData.parentId = this.props.widgetId;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  }*/

  renderAsContainerComponent(props: ContainerWidgetProps<WidgetProps>) {
    return (
      <ContainerComponent {...props}>
        {this.props.widgetId === MAIN_CONTAINER_WIDGET_ID && (
          <CanvasSelectionArena widgetId={MAIN_CONTAINER_WIDGET_ID} />
        )}
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
