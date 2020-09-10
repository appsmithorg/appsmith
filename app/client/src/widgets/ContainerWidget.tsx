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

import { WidgetProps, WidgetState } from "./NewBaseWidget";
import * as Sentry from "@sentry/react";
import { getWidgetDimensions } from "./helpers";

class ContainerWidget extends React.Component<
  ContainerWidgetProps,
  WidgetState
> {
  constructor(props: ContainerWidgetProps) {
    super(props);
  }
  getSnapSpaces = () => {
    const { componentWidth } = getWidgetDimensions(this.props);
    return {
      snapRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      snapColumnSpace: componentWidth
        ? (componentWidth - (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2) /
          GridDefaults.DEFAULT_GRID_COLUMNS
        : 0,
    };
  };

  // renderChildWidget(childWidgetData: string): React.ReactNode {
  //   // For now, isVisible prop defines whether to render a detached widget

  //   // const snapSpaces = this.getSnapSpaces();
  //   // const { componentWidth, componentHeight } = getWidgetDimensions(this.props);

  //   // if (childWidgetData.type !== WidgetTypes.CANVAS_WIDGET) {
  //   //   childWidgetData.parentColumnSpace = snapSpaces.snapColumnSpace;
  //   //   childWidgetData.parentRowSpace = snapSpaces.snapRowSpace;
  //   // } else {
  //   //   // This is for the detached child like the default CANVAS_WIDGET child

  //   //   childWidgetData.rightColumn = componentWidth;
  //   //   childWidgetData.bottomRow = this.props.shouldScrollContents
  //   //     ? childWidgetData.bottomRow
  //   //     : componentHeight;
  //   //   childWidgetData.minHeight = componentHeight;
  //   //   childWidgetData.isVisible = this.props.isVisible;
  //   //   childWidgetData.shouldScrollContents = false;
  //   //   childWidgetData.canExtend = this.props.shouldScrollContents;
  //   // }

  //   // childWidgetData.parentId = this.props.widgetId;

  //   console.log(this.props, { childWidgetData });
  //   return WidgetFactory.createWidget(childWidgetData);
  // }

  renderChildren = () => {
    return this.props.children?.map(WidgetFactory.createWidget);
    // return _.map(
    //   // sort by row so stacking context is correct
    //   // TODO(abhinav): This is hacky. The stacking context should increase for widgets rendered top to bottom, always.
    //   // Figure out a way in which the stacking context is consistent.
    //   // _.sortBy(_.compact(this.props.children), child => child.topRow),
    //   this.renderChildWidget,
    // );
  };

  renderAsContainerComponent(props: ContainerWidgetProps) {
    return (
      <ContainerComponent {...props}>
        {this.renderChildren()}
      </ContainerComponent>
    );
  }

  render() {
    return this.renderAsContainerComponent(this.props);
  }

  getWidgetType(): WidgetType {
    return WidgetTypes.CONTAINER_WIDGET;
  }
}

export interface ContainerWidgetProps extends WidgetProps {
  children?: string[];
  containerStyle?: ContainerStyle;
  shouldScrollContents?: boolean;
}

export default ContainerWidget;
export const ProfiledContainerWidget = Sentry.withProfiler(ContainerWidget);
