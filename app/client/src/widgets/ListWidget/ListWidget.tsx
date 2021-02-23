import React from "react";
import { get, set, xor } from "lodash";
import * as Sentry from "@sentry/react";

import WidgetFactory from "utils/WidgetFactory";
import { removeFalsyEntries } from "utils/helpers";
import { TriggerPropertiesMap } from "utils/WidgetFactory";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "../BaseWidget";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import ListComponent from "./ListComponent";
import { ContainerStyle } from "components/designSystems/appsmith/ContainerComponent";
import { ContainerWidgetProps } from "../ContainerWidget";
import propertyPaneConfig from "./ListPropertyPaneConfig";

class ListWidget extends BaseWidget<ListWidgetProps<WidgetProps>, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      items: VALIDATION_TYPES.LIST_DATA,
    };
  }

  /**
   * returns the property pane config of the widget
   */
  static getPropertyPaneConfig() {
    return propertyPaneConfig;
  }

  static getDerivedPropertiesMap() {
    return {};
  }

  getCurrentItemStructure = (items: Array<Record<string, unknown>>) => {
    return Array.isArray(items) && items.length > 0
      ? Object.assign(
          {},
          ...Object.keys(items[0]).map((key) => ({
            [key]: "",
          })),
        )
      : {};
  };

  componentDidMount() {
    if (
      !this.props.childAutoComplete ||
      (Object.keys(this.props.childAutoComplete).length === 0 &&
        this.props.items &&
        Array.isArray(this.props.items))
    ) {
      const structure = this.getCurrentItemStructure(this.props.items);
      super.updateWidgetProperty("childAutoComplete", {
        currentItem: structure,
      });
    }
  }

  componentDidUpdate(prevProps: ListWidgetProps<WidgetProps>) {
    const oldRowStructure = this.getCurrentItemStructure(prevProps.items);
    const newRowStructure = this.getCurrentItemStructure(this.props.items);

    if (
      xor(Object.keys(oldRowStructure), Object.keys(newRowStructure)).length > 0
    ) {
      super.updateWidgetProperty("childAutoComplete", {
        currentItem: newRowStructure,
      });
    }
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
    childWidgetData.canExtend =
      childWidgetData.virtualizedEnabled ?? this.props.shouldScrollContents;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.minHeight = componentHeight;
    childWidgetData.rightColumn = componentWidth;
    childWidgetData.noPad = true;

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
        resizeDisabled: index > 0,
        widgetId: index > 0 ? `list-item-${index}` : child.widgetId,
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

                  if (
                    Array.isArray(get(template, `${child.widgetName}.${key}`))
                  ) {
                    set(
                      children[i],
                      `children.[${j}].children[${k}].${key}`,
                      get(template, `${child.widgetName}.${key}.[${i}]`),
                    );
                  }

                  // disabled config options for items other than template
                  if (i > 0) {
                    set(
                      children[i],
                      `children.[${j}].children[${k}].widgetId`,
                      `list-widget-child-id-${i}`,
                    );

                    set(
                      children[i],
                      `children.[${j}].children[${k}].resizeDisabled`,
                      true,
                    );

                    set(
                      children[i],
                      `children.[${j}].children[${k}].settingsControlDisabled`,
                      true,
                    );

                    set(
                      children[i],
                      `children.[${j}].children[${k}].dragDisabled`,
                      true,
                    );
                  }
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

    return updatedChildren;
  };

  // {
  //   list: {
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

    return <ListComponent {...this.props}>{children}</ListComponent>;
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
  currentItemStructure?: Record<string, string>;
}

export default ListWidget;
export const ProfiledListWidget = Sentry.withProfiler(ListWidget);
