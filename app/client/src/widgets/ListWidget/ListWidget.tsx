import React from "react";
import log from "loglevel";
import { get, set, xor } from "lodash";
import * as Sentry from "@sentry/react";

import WidgetFactory from "utils/WidgetFactory";
import { removeFalsyEntries } from "utils/helpers";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import BaseWidget, { WidgetProps, WidgetState } from "../BaseWidget";
import {
  RenderModes,
  WidgetType,
  WidgetTypes,
} from "constants/WidgetConstants";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import ListComponent from "./ListComponent";
import { ContainerStyle } from "components/designSystems/appsmith/ContainerComponent";
import { ContainerWidgetProps } from "../ContainerWidget";
import propertyPaneConfig from "./ListPropertyPaneConfig";
import { EventType } from "constants/ActionConstants";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import ListPagination from "./ListPagination";

class ListWidget extends BaseWidget<ListWidgetProps<WidgetProps>, WidgetState> {
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      items: VALIDATION_TYPES.LIST_DATA,
    };
  }

  state = {
    page: 1,
    perPage: this.props.paginationPerPage,
  };

  /**
   * returns the property pane config of the widget
   */
  static getPropertyPaneConfig() {
    return propertyPaneConfig;
  }

  static getDerivedPropertiesMap() {
    return {};
  }

  /**
   * creates object of keys
   *
   * @param items
   */
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

    if (prevProps.paginationPerPage !== this.props.paginationPerPage) {
      this.setState({ perPage: this.props.paginationPerPage });
    }
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      itemBackgroundColor: "#FFFFFF",
    };
  }

  /**
   * on click item action
   *
   * @param rowIndex
   * @param action
   * @param onComplete
   */
  onItemClick = (
    rowIndex: number,
    action: string | undefined,
    onComplete: () => void,
  ) => {
    if (!action) return;

    try {
      const rowData = [this.props.items[rowIndex]];
      const { jsSnippets } = getDynamicBindings(action);
      const modifiedAction = jsSnippets.reduce((prev: string, next: string) => {
        return prev + `{{(currentItem) => { ${next} }}} `;
      }, "");

      super.executeAction({
        dynamicString: modifiedAction,
        event: {
          type: EventType.ON_CLICK,
          callback: onComplete,
        },
        responseData: rowData,
      });
    } catch (error) {
      log.debug("Error parsing row action", error);
    }
  };

  renderChild = (childWidgetData: WidgetProps) => {
    const { componentWidth, componentHeight } = this.getComponentDimensions();

    childWidgetData.parentId = this.props.widgetId;
    childWidgetData.shouldScrollContents = this.props.shouldScrollContents;
    childWidgetData.canExtend =
      childWidgetData.virtualizedEnabled && false
        ? true
        : this.props.shouldScrollContents;
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
    const gridGap = this.props.gridGap || 0;
    return children.map((child: ContainerWidgetProps<WidgetProps>, index) => {
      const gap = gridGap;

      return {
        ...child,
        gap,
        backgroundColor: this.props.itemBackgroundColor,
        topRow: index * children[0].bottomRow + index * gap,
        bottomRow: (index + 1) * children[0].bottomRow + index * gap,
        resizeDisabled:
          index > 0 && this.props.renderMode === RenderModes.CANVAS,
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
                }
              }

              // disabled config options for items other than template
              if (i > 0 && this.props.renderMode === RenderModes.CANVAS) {
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

    return children;
  };

  updateGridChildrenProps = (children: ContainerWidgetProps<WidgetProps>[]) => {
    let updatedChildren = this.useNewValues(children);
    updatedChildren = this.updateActions(updatedChildren);
    updatedChildren = this.paginateItems(updatedChildren);
    updatedChildren = this.updatePosition(updatedChildren);

    return updatedChildren;
  };

  updateActions = (children: ContainerWidgetProps<WidgetProps>[]) => {
    return children.map((child: ContainerWidgetProps<WidgetProps>, index) => {
      return {
        ...child,
        onClick: () =>
          this.onItemClick(index, this.props.onListItemClick, () => {
            //
          }),
      };
    });
  };

  /**
   * paginate items
   *
   * @param children
   */
  paginateItems = (children: ContainerWidgetProps<WidgetProps>[]) => {
    const { page, perPage } = this.state;

    if (this.canPaginate()) {
      return children.slice((page - 1) * perPage, page * perPage);
    }

    return children;
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
   * can data be paginated
   */
  canPaginate = () => {
    return this.props.allowPagination && !isNaN(this.props.paginationPerPage);
  };

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const children = this.renderChildren();
    const hasPagination = this.canPaginate();

    if (Array.isArray(this.props.items) && this.props.items.length === 0) {
      return <>Nothing to display</>;
    }

    return (
      <ListComponent {...this.props} hasPagination={hasPagination}>
        {children}

        {hasPagination && (
          <ListPagination
            total={this.props.items.length}
            current={this.state.page}
            perPage={this.state.perPage}
            onChange={(page: number) => this.setState({ page })}
          />
        )}
      </ListComponent>
    );
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
