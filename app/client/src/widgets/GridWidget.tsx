import React from "react";
import * as Sentry from "@sentry/react";

import WidgetFactory from "utils/WidgetFactory";
import { generateReactKey } from "utils/generators";
import { WidgetOperations } from "widgets/BaseWidget";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import GridComponent from "components/designSystems/appsmith/GridComponent";
import { ContainerStyle } from "components/designSystems/appsmith/ContainerComponent";

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

  renderChildWidget = (childWidgetData: WidgetProps) => {
    const { componentWidth, componentHeight } = this.getComponentDimensions();

    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? childWidgetData.bottomRow
      : componentHeight - 1;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.containerStyle = "none";
    childWidgetData.minHeight = componentHeight;
    childWidgetData.rightColumn = componentWidth;

    console.log({ childWidgetData });

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  };

  getChildren = () => {
    if (this.props.children && this.props.children.length > 0) {
      const children = this.props.children.filter(Boolean);
      return children.length > 0 && children.map(this.renderChildWidget);
    }
  };

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const children = this.getChildren();

    console.log({ children });

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
