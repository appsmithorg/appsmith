import React from "react";
import { get } from "lodash";
import * as Sentry from "@sentry/react";

import WidgetFactory from "utils/WidgetFactory";
import { removeFalsyEntries } from "utils/helpers";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import GridComponent from "components/designSystems/appsmith/GridComponent";
import { ContainerStyle } from "components/designSystems/appsmith/ContainerComponent";
import { ContainerWidgetProps } from "./ContainerWidget";
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

  renderChild = (childWidgetData: WidgetProps) => {
    const { componentWidth, componentHeight } = this.getComponentDimensions();

    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.shouldScrollContents = true;
    childWidgetData.canExtend = this.props.shouldScrollContents;
    childWidgetData.bottomRow = childWidgetData.bottomRow;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.containerStyle = "card";
    childWidgetData.minHeight = componentHeight;
    childWidgetData.rightColumn = childWidgetData.rightColumn;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  };

  /**
   * here we are updating the position of each items and disabled resizing for
   * all items except template ( first item )
   *
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
        resizeEnabled: index === 0,
        widgetId: index > 0 ? generateReactKey() : child.widgetId,
      };
    });
  };

  /**
   * @param children
   */
  setPathsForNewChildrenInGrid = (
    children: ContainerWidgetProps<WidgetProps>[],
  ) => {
    const { dynamicBindingPathList } = this.props;
    const templateChildrens = get(children, "0.children.0.children", []);

    // const updatedDynamicBindingPathList: any = [];

    // templateChildrens?.map((child: WidgetProps) => {
    //   if (child.dynamicBindingPathList) {
    //     child.dynamicBindingPathList?.map((item: { key: string }) => {
    //       updatedDynamicBindingPathList.push({
    //         key: `templateValues.template.${child.widgetName}.${item.key}`,
    //       });
    //     });
    //   }
    // });

    // console.log({ updatedDynamicBindingPathList });

    // super.updateWidgetProperty(
    //   "dynamicBindingPathList",
    //   dynamicBindingPathList?.concat(updatedDynamicBindingPathList),
    // );

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

      // here we are duplicating the template for each items in the data array
      // first item of the canvasChildren acts as a template
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
