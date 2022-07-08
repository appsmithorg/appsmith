import React from "react";
import styled from "styled-components";
import { compact, map, sortBy } from "lodash";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import WidgetFactory, { DerivedPropertiesMap } from "utils/WidgetFactory";

import AutoLayoutContainerComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";
import { LayoutDirection } from "components/constants";

class AutoLayoutContainerWidget extends BaseWidget<
  AutoLayoutContainerWidgetProps<WidgetProps>,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        helpText: "Controls the visibility of the widget",
        propertyName: "direction",
        label: "Direction",
        controlType: "DROP_DOWN",
        options: [
          { label: "Horizontal", value: LayoutDirection.Horizontal },
          { label: "Vertical", value: LayoutDirection.Vertical },
        ],
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
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

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    // For now, isVisible prop defines whether to render a detached widget
    if (childWidgetData.detachFromLayout && !childWidgetData.isVisible) {
      return null;
    }

    const { componentHeight, componentWidth } = this.getComponentDimensions();

    childWidgetData.rightColumn = componentWidth;
    childWidgetData.bottomRow = childWidgetData.bottomRow;
    childWidgetData.minHeight = componentHeight;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = true;

    childWidgetData.parentId = this.props.widgetId;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  }

  renderChildren = () => {
    return map(
      // sort by row so stacking context is correct
      // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
      // Figure out a way in which the stacking context is consistent.
      sortBy(compact(this.props.children), (child: any) => child.topRow),
      this.renderChildWidget,
    );
  };

  getPageView() {
    return (
      <AutoLayoutContainerComponent
        {...this.props}
        isVertical={this.props.direction === LayoutDirection.Vertical}
      >
        {this.renderChildren()}
      </AutoLayoutContainerComponent>
    );
  }

  static getWidgetType(): string {
    return "AUTOLAYOUTCONTAINER_WIDGET";
  }
}

export interface AutoLayoutContainerWidgetProps<T extends WidgetProps>
  extends WidgetProps {
  children?: T[];
}

export default AutoLayoutContainerWidget;
