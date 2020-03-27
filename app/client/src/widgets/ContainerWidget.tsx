import React from "react";
import _ from "lodash";

import ContainerComponent, {
  ContainerStyle,
} from "components/designSystems/appsmith/ContainerComponent";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
import {
  GridDefaults,
  CONTAINER_GRID_PADDING,
  WIDGET_PADDING,
} from "constants/WidgetConstants";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";

class ContainerWidget extends BaseWidget<
  ContainerWidgetProps<WidgetProps>,
  WidgetState
> {
  constructor(props: ContainerWidgetProps<WidgetProps>) {
    super(props);
    this.renderChildWidget = this.renderChildWidget.bind(this);
  }
  getSnapSpaces = () => {
    const { componentWidth } = this.getComponentDimensions();
    return {
      snapRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      snapColumnSpace: componentWidth
        ? (componentWidth - (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2) /
          GridDefaults.DEFAULT_GRID_COLUMNS
        : 0,
    };
  };

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    // For now, isVisible prop defines whether to render a detached widget
    if (childWidgetData.detachFromLayout && !childWidgetData.isVisible) {
      return null;
    }

    const snapSpaces = this.getSnapSpaces();
    const { componentWidth, componentHeight } = this.getComponentDimensions();

    if (!childWidgetData.detachFromLayout) {
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

    childWidgetData.parentId = this.props.widgetId;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  }

  renderChildren = () => {
    return _.map(
      // sort by row so stacking context is correct
      // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
      // Figure out a way in which the stacking context is consistent.
      _.sortBy(_.compact(this.props.children), child => child.topRow),
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

  getPageView() {
    return this.renderAsContainerComponent(this.props);
  }

  getWidgetType(): WidgetType {
    return WidgetTypes.CONTAINER_WIDGET;
  }
}

export interface ContainerWidgetProps<T extends WidgetProps>
  extends WidgetProps {
  children?: T[];
  containerStyle?: ContainerStyle;
  shouldScrollContents?: boolean;
}

export default ContainerWidget;
