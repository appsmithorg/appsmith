import React from "react";
import _ from "lodash";

import { ContainerStyle } from "components/designSystems/appsmith/ContainerComponent";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import WidgetFactory from "utils/WidgetFactory";
import { WidgetOperations } from "widgets/BaseWidget";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import GridComponent from "components/designSystems/appsmith/GridComponent";
import * as Sentry from "@sentry/react";
import { generateReactKey } from "utils/generators";

class GridWidget extends BaseWidget<GridWidgetProps<WidgetProps>, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      items: VALIDATION_TYPES.GRID_DATA,
    };
  }

  static getDerivedPropertiesMap() {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getTriggerPropertyMap(): TriggerPropertiesMap {
    return {};
  }

  /**
   * as grid component will have a container of its own,
   * we creating the container on mount
   */
  componentDidMount() {
    this.generateContainer();
  }

  /**
   * generates a canvas container where widget can be dragged.
   */
  generateContainer = () => {
    const { widgetId } = this.props;

    const container = {
      type: WidgetTypes.CANVAS_WIDGET,
      widgetId: generateReactKey(),
      parentId: widgetId,
      detachFromLayout: true,
      children: [],
      parentRowSpace: 1,
      parentColumnSpace: 1,
      containerStyle: "card",
      leftColumn: 0,
      rightColumn:
        (this.props.rightColumn - this.props.leftColumn) *
        this.props.parentColumnSpace,
      topRow: 0,
      bottomRow:
        (this.props.bottomRow - this.props.topRow) * this.props.parentRowSpace,
      isLoading: false,
    };

    this.updateWidget(WidgetOperations.ADD_CHILDREN, widgetId, {
      children: [container],
    });
  };

  /**
   * renders the children widgets
   *
   * TODO(pawan) - add logic for grid items
   */
  getChildren = () => {
    const childWidgetData: any = this.props.children?.filter(Boolean)[0];

    if (!childWidgetData) {
      return null;
    }

    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;
    const { componentWidth, componentHeight } = this.getComponentDimensions();
    childWidgetData.rightColumn = componentWidth;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? childWidgetData.bottomRow
      : componentHeight - 1;
    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.minHeight = componentHeight;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  };

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const children = this.getChildren();

    return <GridComponent {...this.props}>{children}</GridComponent>;
  }

  /**
   * returns type of the widget
   */
  getWidgetType(): WidgetType {
    return WidgetTypes.GRID_WIDGET;
  }
}

export interface GridWidgetProps<T extends WidgetProps> extends WidgetProps {
  children?: T[];
  containerStyle?: ContainerStyle;
  shouldScrollContents?: boolean;
  onListItemClick?: string;
  items: Array<Record<string, unknown>>;
}

export default GridWidget;
export const ProfiledGridWidget = Sentry.withProfiler(GridWidget);
