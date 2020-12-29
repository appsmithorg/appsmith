import React from "react";
import * as Sentry from "@sentry/react";

import WidgetFactory from "utils/WidgetFactory";
import { removeFalsyEntries } from "utils/helpers";
import { generateReactKey } from "utils/generators";
import { WidgetOperations } from "widgets/BaseWidget";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import GridComponent from "components/designSystems/appsmith/GridComponent";
import { ContainerStyle } from "components/designSystems/appsmith/ContainerComponent";
import { ContainerWidgetProps } from "./ContainerWidget";

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

  renderChild = (childWidgetData: WidgetProps) => {
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

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  };

  /**
   * @param children
   */
  updatePosition = (
    children: ContainerWidgetProps<WidgetProps>[],
  ): ContainerWidgetProps<WidgetProps>[] => {
    return children.map((child: ContainerWidgetProps<WidgetProps>, index) => {
      return {
        ...child,
        topRow: index * children[0].bottomRow,
        bottomRow: (index + 1) * children[0].bottomRow,
        resizeDisabled: index > 0,
      };
    });
  };

  /**
   *
   * @param children
   */
  setPathsForNewChildrenInGrid = (
    children: ContainerWidgetProps<WidgetProps>[],
  ) => {
    return children;
  };

  updateGridChildrenProps = (children: ContainerWidgetProps<WidgetProps>[]) => {
    let updatedChildren = this.updatePosition(children);

    updatedChildren = this.setPathsForNewChildrenInGrid(updatedChildren);
    // updatedChildren = this.replaceBindings(updatedChildren);
    // updatedChildren = this.useNewValues(updatedChildren);
    // Position all children based on alignment of the grid and gap
    // Replace bindings with value {{currentRow.email}} => email
    //

    return updatedChildren;
  };

  // {
  //   grid: {
  //     children: [ <--- children
  //       {
  //         canvas: { <--- childCanvas
  //           children: [ <---- canvasChildren
  //             {
  //               container: {
  //                 children: [
  //                   0: {
  //                     canvas: [
  //                       {
  //                         button
  //                         image
  //                       }
  //                     ]
  //                   },
  //                   1: {
  //                     canvas: [
  //                       {
  //                         button
  //                         image
  //                       }
  //                     ]
  //                   }
  //                 ]
  //               }
  //             }
  //           ]
  //         }
  //       }
  //     ]
  //   }
  // }

  /**
   * renders children
   */
  renderChildren = () => {
    const numberOfItemsInGrid = this.props.items.length;

    console.log({ props: this.props });

    if (this.props.children && this.props.children.length > 0) {
      const children = removeFalsyEntries(this.props.children);

      const childCanvas = children[0];
      let canvasChildren = childCanvas.children;
      canvasChildren = new Array(numberOfItemsInGrid).fill(canvasChildren[0]);
      canvasChildren = this.updateGridChildrenProps(canvasChildren);
      childCanvas.children = canvasChildren;

      return this.renderChild(childCanvas);
    }
  };

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const children = this.renderChildren();

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
