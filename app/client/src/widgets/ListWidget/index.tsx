import React from "react";
import { get, set, fill } from "lodash";
import * as Sentry from "@sentry/react";

import WidgetFactory from "utils/WidgetFactory";
import { removeFalsyEntries } from "utils/helpers";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "../BaseWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import { WidgetPropertyValidationType } from "utils/WidgetValidation";
import GridComponent from "components/designSystems/appsmith/GridComponent";
import { ContainerStyle } from "components/designSystems/appsmith/ContainerComponent";
import { generateReactKey } from "utils/generators";
import { ContainerWidgetProps } from "../ContainerWidget";
import propertyPaneConfig from "./ListPropertyPaneConfig";

class ListWidget extends BaseWidget<ListWidgetProps<WidgetProps>, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      items: VALIDATION_TYPES.GRID_DATA,
    };
  }

  static getPropertyPaneConfig() {
    return propertyPaneConfig;
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
  useNewValues = (children: ContainerWidgetProps<WidgetProps>[]) => {
    const { template, dynamicBindingPathList } = this.props;

    for (let i = 0; i < children.length; i++) {
      const container = children[i];

      if (Array.isArray(container.children)) {
        for (let j = 0; j < container.children.length; j++) {
          const canvas = container.children[j];

          if (Array.isArray(canvas.children)) {
            for (let k = 0; k < canvas.children.length; k++) {
              const child = canvas.children[k];

              if (Array.isArray(dynamicBindingPathList)) {
                const dynamicKeys = dynamicBindingPathList.map((path) =>
                  path.key.split(".").pop(),
                );

                for (let l = 0; l < dynamicKeys.length; l++) {
                  const key = dynamicKeys[l];

                  console.log({
                    index: i,
                    child: get(
                      children,
                      `[${i}].children.[${j}].children[${k}].${key}`,
                    ),
                    value: get(template, `${child.widgetName}.${key}.[${i}]`),
                  });

                  set(
                    children[i],
                    `children.[${j}].children[${k}].${key}`,
                    get(template, `${child.widgetName}.${key}.[${i}]`),
                  );
                }
              }
            }
          }
        }
      }
    }

    return children;
  };

  updateGridChildrenProps = (children: ContainerWidgetProps<WidgetProps>[]) => {
    let updatedChildren = this.updatePosition(children);

    updatedChildren = this.useNewValues(updatedChildren);
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

    if (this.props.children && this.props.children.length > 0) {
      const children = removeFalsyEntries(this.props.children);

      const childCanvas = children[0];
      let canvasChildren = childCanvas.children;

      // here we are duplicating the template for each items in the data array
      // first item of the canvasChildren acts as a template
      const template = canvasChildren.slice(0, 1).shift();

      for (let i = 0; i < numberOfItemsInGrid; i++) {
        canvasChildren[i] = JSON.parse(JSON.stringify(template));
      }

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
    return WidgetTypes.LIST_WIDGET;
  }
}

export interface ListWidgetProps<T extends WidgetProps> extends WidgetProps {
  children?: T[];
  containerStyle?: ContainerStyle;
  shouldScrollContents?: boolean;
  onListItemClick?: string;
  items: Array<Record<string, unknown>>;
}

export default ListWidget;
export const ProfiledListWidget = Sentry.withProfiler(ListWidget);
