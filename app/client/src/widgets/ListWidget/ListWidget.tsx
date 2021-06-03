import React from "react";
import log from "loglevel";
import {
  compact,
  get,
  set,
  xor,
  isNumber,
  round,
  range,
  toString,
  isBoolean,
} from "lodash";
import * as Sentry from "@sentry/react";

import WidgetFactory from "utils/WidgetFactory";
import { removeFalsyEntries } from "utils/helpers";
import BaseWidget, { WidgetProps, WidgetState } from "../BaseWidget";
import {
  RenderModes,
  WidgetType,
  WidgetTypes,
} from "constants/WidgetConstants";
import ListComponent, {
  ListComponentEmpty,
  ListComponentLoading,
} from "./ListComponent";
import { ContainerStyle } from "components/designSystems/appsmith/ContainerComponent";
import { ContainerWidgetProps } from "../ContainerWidget";
import propertyPaneConfig from "./ListPropertyPaneConfig";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import ListPagination from "./ListPagination";
import withMeta from "./../MetaHOC";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { GridDefaults, WIDGET_PADDING } from "constants/WidgetConstants";

class ListWidget extends BaseWidget<ListWidgetProps<WidgetProps>, WidgetState> {
  state = {
    page: 1,
  };

  /**
   * returns the property pane config of the widget
   */
  static getPropertyPaneConfig() {
    return propertyPaneConfig;
  }

  static getDerivedPropertiesMap() {
    return {
      selectedItem: `{{(()=>{
        const selectedItemIndex =
          this.selectedItemIndex === undefined ||
          Number.isNaN(parseInt(this.selectedItemIndex))
            ? -1
            : parseInt(this.selectedItemIndex);
        const items = this.items || [];
        if (selectedItemIndex === -1) {
          const emptyRow = { ...items[0] };
          Object.keys(emptyRow).forEach((key) => {
            emptyRow[key] = "";
          });
          return emptyRow;
        }
        const selectedItem = { ...items[selectedItemIndex] };
        return selectedItem;
      })()}}`,
    };
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
  onItemClick = (rowIndex: number, action: string | undefined) => {
    // setting selectedItemIndex on click of container
    const selectedItemIndex = isNumber(this.props.selectedItemIndex)
      ? this.props.selectedItemIndex
      : -1;

    if (selectedItemIndex !== rowIndex) {
      this.props.updateWidgetMetaProperty("selectedItemIndex", rowIndex, {
        dynamicString: this.props.onRowSelected,
        event: {
          type: EventType.ON_ROW_SELECTED,
        },
      });
    }

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
        },
        responseData: rowData,
      });
    } catch (error) {
      log.debug("Error parsing row action", error);
    }
  };

  renderChild = (childWidgetData: WidgetProps) => {
    const { componentHeight, componentWidth } = this.getComponentDimensions();

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
      const gap = gridGap - 8;

      return {
        ...child,
        gap,
        backgroundColor: this.props.itemBackgroundColor,
        topRow:
          index * children[0].bottomRow +
          index * (gap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT),
        bottomRow:
          (index + 1) * children[0].bottomRow +
          index * (gap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT),
        resizeDisabled:
          index > 0 && this.props.renderMode === RenderModes.CANVAS,
      };
    });
  };

  updateTemplateWidgetProperties = (widget: WidgetProps, itemIndex: number) => {
    const {
      dynamicBindingPathList,
      dynamicTriggerPathList,
      template,
    } = this.props;
    const { widgetName = "" } = widget;
    // Update properties if they're dynamic
    // `template` property should have an array of values
    // if it is a dynamicbinding

    if (
      Array.isArray(dynamicBindingPathList) &&
      dynamicBindingPathList.length > 0
    ) {
      // Get all paths in the dynamicBindingPathList sans the List Widget name prefix
      const dynamicPaths: string[] = compact(
        dynamicBindingPathList.map((path: Record<"key", string>) =>
          path.key.split(".").pop(),
        ),
      );

      // Update properties in the widget based on the paths
      // By picking the correct value from the evaluated values in the template
      dynamicPaths.forEach((path: string) => {
        const evaluatedProperty = get(template, `${widgetName}.${path}`);

        if (
          Array.isArray(evaluatedProperty) &&
          evaluatedProperty.length > itemIndex
        ) {
          const evaluatedValue = evaluatedProperty[itemIndex];
          const validationPath = get(widget, `validationPaths.${path}`);

          if (
            validationPath === VALIDATION_TYPES.BOOLEAN &&
            isBoolean(evaluatedValue)
          ) {
            set(widget, path, evaluatedValue);
          } else {
            set(widget, path, toString(evaluatedValue));
          }
        }
      });
    }

    if (
      Array.isArray(dynamicTriggerPathList) &&
      dynamicTriggerPathList.length > 0
    ) {
      // Get all paths in the dynamicBindingPathList sans the List Widget name prefix
      const triggerPaths: string[] = compact(
        dynamicTriggerPathList.map((path: Record<"key", string>) =>
          path.key.indexOf(`template.${widgetName}`) === 0
            ? path.key.split(".").pop()
            : undefined,
        ),
      );

      triggerPaths.forEach((path: string) => {
        const propertyValue = get(this.props.template[widget.widgetName], path);

        if (
          propertyValue.indexOf("currentItem") > -1 &&
          propertyValue.indexOf("{{((currentItem) => {") === -1
        ) {
          const { jsSnippets } = getDynamicBindings(propertyValue);
          const listItem = this.props.items[itemIndex];

          const newPropertyValue = jsSnippets.reduce(
            (prev: string, next: string) => {
              if (next.indexOf("currentItem") > -1) {
                return (
                  prev +
                  `{{((currentItem) => { ${next}})(JSON.parse('${JSON.stringify(
                    listItem,
                  )}'))}}`
                );
              }
              return prev + `{{${next}}}`;
            },
            "",
          );
          set(widget, path, newPropertyValue);
        }
      });
    }

    return this.updateNonTemplateWidgetProperties(widget, itemIndex);
  };

  updateNonTemplateWidgetProperties = (
    widget: WidgetProps,
    itemIndex: number,
  ) => {
    const { page } = this.state;
    const { perPage } = this.shouldPaginate();

    if (itemIndex > 0) {
      const originalIndex = ((page - 1) * perPage - itemIndex) * -1;

      if (this.props.renderMode === RenderModes.PAGE) {
        set(
          widget,
          `widgetId`,
          `list-widget-child-id-${itemIndex}-${widget.widgetName}`,
        );
      }

      if (originalIndex !== 0) {
        set(
          widget,
          `widgetId`,
          `list-widget-child-id-${itemIndex}-${widget.widgetName}`,
        );

        if (this.props.renderMode === RenderModes.CANVAS) {
          set(widget, `resizeDisabled`, true);
          set(widget, `disablePropertyPane`, true);
          set(widget, `dragDisabled`, true);
          set(widget, `dropDisabled`, true);
        }
      }
    }

    return widget;
  };

  /**
   * @param children
   */
  useNewValues = (children: ContainerWidgetProps<WidgetProps>[]) => {
    const updatedChildren = children.map(
      (
        listItemContainer: ContainerWidgetProps<WidgetProps>,
        listItemIndex: number,
      ) => {
        let updatedListItemContainer = listItemContainer;
        // Get an array of children in the current list item
        const listItemChildren = get(
          updatedListItemContainer,
          "children[0].children",
          [],
        );
        // If children exist
        if (listItemChildren.length > 0) {
          // Update the properties of all the children
          const updatedListItemChildren = listItemChildren.map(
            (templateWidget: WidgetProps) => {
              // This will return the updated child widget
              return this.updateTemplateWidgetProperties(
                templateWidget,
                listItemIndex,
              );
            },
          );
          // Set the update list of children as the new children for the current list item
          set(
            updatedListItemContainer,
            "children[0].children",
            updatedListItemChildren,
          );
        }
        // Get the item container's canvas child widget
        const listItemContainerCanvas = get(
          updatedListItemContainer,
          "children[0]",
        );
        // Set properties of the container's canvas child widget
        const updatedListItemContainerCanvas = this.updateNonTemplateWidgetProperties(
          listItemContainerCanvas,
          listItemIndex,
        );
        // Set the item container's canvas child widget
        set(
          updatedListItemContainer,
          "children[0]",
          updatedListItemContainerCanvas,
        );
        // Set properties of the item container
        updatedListItemContainer = this.updateNonTemplateWidgetProperties(
          listItemContainer,
          listItemIndex,
        );
        return updatedListItemContainer;
      },
    );

    return updatedChildren;
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
        onClickCapture: () =>
          this.onItemClick(index, this.props.onListItemClick),
        selected: this.props.selectedItemIndex === index,
        focused: index === 0 && this.props.renderMode === RenderModes.CANVAS,
      };
    });
  };

  /**
   * paginate items
   *
   * @param children
   */
  paginateItems = (children: ContainerWidgetProps<WidgetProps>[]) => {
    const { page } = this.state;
    const { perPage, shouldPaginate } = this.shouldPaginate();

    if (shouldPaginate) {
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

      try {
        // here we are duplicating the template for each items in the data array
        // first item of the canvasChildren acts as a template
        const template = canvasChildren.slice(0, 1).shift();

        for (let i = 0; i < numberOfItemsInGrid; i++) {
          canvasChildren[i] = JSON.parse(JSON.stringify(template));
        }

        // TODO(pawan): This is recalculated everytime for not much reason
        // We should either use https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops
        // Or use memoization https://reactjs.org/blog/2018/06/07/you-probably-dont-need-derived-state.html#what-about-memoization
        // In particular useNewValues can be memoized, if others can't.
        canvasChildren = this.updateGridChildrenProps(canvasChildren);

        childCanvas.children = canvasChildren;
      } catch (e) {
        console.log({ error: e });
      }

      return this.renderChild(childCanvas);
    }
  };

  /**
   * 400
   * 200
   * can data be paginated
   */
  shouldPaginate = () => {
    let { gridGap } = this.props;
    const { children, items } = this.props;
    const { componentHeight } = this.getComponentDimensions();
    const templateBottomRow = get(children, "0.children.0.bottomRow");
    const templateHeight =
      templateBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    try {
      gridGap = parseInt(gridGap);

      if (!isNumber(gridGap) || isNaN(gridGap)) {
        gridGap = 0;
      }
    } catch {
      gridGap = 0;
    }

    const shouldPaginate =
      templateHeight * items.length + parseInt(gridGap) * (items.length - 1) >
      componentHeight;

    const totalSpaceAvailable = componentHeight - (100 + WIDGET_PADDING * 2);
    const spaceTakenByOneContainer =
      templateHeight + (gridGap * (items.length - 1)) / items.length;

    const perPage = totalSpaceAvailable / spaceTakenByOneContainer;

    return { shouldPaginate, perPage: round(perPage) };
  };

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const children = this.renderChildren();
    const { perPage, shouldPaginate } = this.shouldPaginate();

    if (this.props.isLoading) {
      return (
        <ListComponentLoading className="">
          {range(10).map((i) => (
            <div className="bp3-card bp3-skeleton" key={`skeleton-${i}`}>
              <h5 className="bp3-heading">
                <a className=".modifier" href="#">
                  Card heading
                </a>
              </h5>
              <p className=".modifier">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque
                eget tortor felis. Fusce dapibus metus in dapibus mollis.
                Quisque eget ex diam.
              </p>
              <button
                className="bp3-button bp3-icon-add .modifier"
                type="button"
              >
                Submit
              </button>
            </div>
          ))}
        </ListComponentLoading>
      );
    }

    if (!isNumber(perPage) || perPage === 0) {
      return (
        <ListComponentEmpty>
          Please make sure the list widget size is greater than the template
        </ListComponentEmpty>
      );
    }

    if (
      Array.isArray(this.props.items) &&
      this.props.items.length === 0 &&
      this.props.renderMode === RenderModes.PAGE
    ) {
      return <ListComponentEmpty>No data to display</ListComponentEmpty>;
    }

    return (
      <ListComponent {...this.props} hasPagination={shouldPaginate}>
        {children}

        {shouldPaginate && (
          <ListPagination
            current={this.state.page}
            disabled={false && this.props.renderMode === RenderModes.CANVAS}
            onChange={(page: number) => this.setState({ page })}
            perPage={perPage}
            total={this.props.items.length}
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
export const ProfiledListWidget = Sentry.withProfiler(withMeta(ListWidget));
