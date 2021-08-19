import React from "react";
import log from "loglevel";
import {
  compact,
  get,
  set,
  xor,
  isNumber,
  range,
  toString,
  isBoolean,
  omit,
  isEqual,
  floor,
} from "lodash";
import * as Sentry from "@sentry/react";
import memoizeOne from "memoize-one";

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
import { GridDefaults, WIDGET_PADDING } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import derivedProperties from "./parseDerivedProperties";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { shallowEqual } from "react-redux";

const LIST_WIDGET_PAGINATION_HEIGHT = 36;
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
      selectedItem: `{{(()=>{${derivedProperties.getSelectedItem}})()}}`,
      items: `{{(() => {${derivedProperties.getItems}})()}}`,
    };
  }

  /**
   * creates object of keys
   *
   * @param items
   */
  getCurrentItemStructure = (listData: Array<Record<string, unknown>>) => {
    return Array.isArray(listData) && listData.length > 0
      ? Object.assign(
          {},
          ...Object.keys(listData[0]).map((key) => ({
            [key]: "",
          })),
        )
      : {};
  };

  componentDidMount() {
    if (
      !this.props.childAutoComplete ||
      (Object.keys(this.props.childAutoComplete).length === 0 &&
        this.props.listData &&
        Array.isArray(this.props.listData))
    ) {
      const structure = this.getCurrentItemStructure(this.props.listData || []);
      this.props.updateWidgetMetaProperty("childAutoComplete", {
        currentItem: structure,
        currentIndex: "",
      });
    }

    // generate childMetaPropertyMap
    this.generateChildrenDefaultPropertiesMap(this.props);
    this.generateChildrenMetaPropertiesMap(this.props);
    this.generateChildrenEntityDefinitions(this.props);
  }

  /**
   * generates the children entity definitions for children
   *
   * by entity definition we mean properties that will be open for users for autocomplete
   *
   * @param props
   */
  generateChildrenEntityDefinitions(props: ListWidgetProps<WidgetProps>) {
    const template = props.template;
    const childrenEntityDefinitions: Record<string, any> = {};

    if (template) {
      Object.keys(template).map((key: string) => {
        const currentTemplate = template[key];
        const widgetType = currentTemplate.type;

        childrenEntityDefinitions[widgetType] = Object.keys(
          omit(get(entityDefinitions, `${widgetType}`), ["!doc", "!url"]),
        );
      });
    }

    if (this.props.updateWidgetMetaProperty) {
      this.props.updateWidgetMetaProperty(
        "childrenEntityDefinitions",
        childrenEntityDefinitions,
      );
    }
  }

  generateChildrenDefaultPropertiesMap = (
    props: ListWidgetProps<WidgetProps>,
  ) => {
    const template = props.template;
    let childrenDefaultPropertiesMap = {};

    if (template) {
      Object.keys(template).map((key: string) => {
        const currentTemplate = template[key];
        const defaultProperties = WidgetFactory.getWidgetDefaultPropertiesMap(
          currentTemplate.type,
        );

        Object.keys(defaultProperties).map((defaultPropertyKey: string) => {
          childrenDefaultPropertiesMap = {
            ...childrenDefaultPropertiesMap,
            [`${key}.${defaultPropertyKey}`]: defaultProperties[
              defaultPropertyKey
            ],
          };
        });
      });
    }

    if (this.props.updateWidgetMetaProperty) {
      this.props.updateWidgetMetaProperty(
        "childrenDefaultPropertiesMap",
        childrenDefaultPropertiesMap,
      );
    }
  };

  generateChildrenMetaPropertiesMap = (props: ListWidgetProps<WidgetProps>) => {
    const template = props.template;
    let childrenMetaPropertiesMap = {};

    if (template) {
      Object.keys(template).map((key: string) => {
        const currentTemplate = template[key];
        const metaProperties = WidgetFactory.getWidgetMetaPropertiesMap(
          currentTemplate.type,
        );

        Object.keys(metaProperties).map((metaPropertyKey: string) => {
          childrenMetaPropertiesMap = {
            ...childrenMetaPropertiesMap,
            [`${key}.${metaPropertyKey}`]: currentTemplate[metaPropertyKey],
          };
        });
      });
    }

    if (this.props.updateWidgetMetaProperty) {
      this.props.updateWidgetMetaProperty(
        "childrenMetaPropertiesMap",
        Object.keys(childrenMetaPropertiesMap),
      );
    }
  };

  componentDidUpdate(prevProps: ListWidgetProps<WidgetProps>) {
    const oldRowStructure = this.getCurrentItemStructure(
      prevProps.listData || [],
    );
    const newRowStructure = this.getCurrentItemStructure(
      this.props.listData || [],
    );

    if (
      xor(Object.keys(oldRowStructure), Object.keys(newRowStructure)).length > 0
    ) {
      this.props.updateWidgetMetaProperty("childAutoComplete", {
        currentItem: newRowStructure,
        currentIndex: "",
      });
    }

    if (
      xor(
        Object.keys(get(prevProps, "template", {})),
        Object.keys(get(this.props, "template", {})),
      ).length > 0
    ) {
      this.generateChildrenDefaultPropertiesMap(this.props);
      this.generateChildrenMetaPropertiesMap(this.props);
      this.generateChildrenEntityDefinitions(this.props);
    }
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, string> {
    return {};
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
    } else {
      this.props.updateWidgetMetaProperty("selectedItemIndex", undefined);
    }

    if (!action) return;

    try {
      const rowData = [this.props.listData?.[rowIndex]] || [];
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
    const { shouldPaginate } = this.shouldPaginate();
    const { componentHeight, componentWidth } = this.getComponentDimensions();

    childWidgetData.parentId = this.props.widgetId;
    // childWidgetData.shouldScrollContents = this.props.shouldScrollContents;
    childWidgetData.canExtend = undefined;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.minHeight = componentHeight;
    childWidgetData.rightColumn = componentWidth;
    childWidgetData.noPad = true;
    childWidgetData.isVirtualized = this.props.isVirtualized;
    childWidgetData.bottomRow = shouldPaginate
      ? componentHeight - LIST_WIDGET_PAGINATION_HEIGHT
      : componentHeight;

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
          path.key.replace(`template.${widgetName}.`, ""),
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
          const validationPath = get(widget, `validationPaths`)[path];

          if (
            (validationPath?.type === ValidationTypes.BOOLEAN &&
              isBoolean(evaluatedValue)) ||
            validationPath?.type === ValidationTypes.OBJECT
          ) {
            set(widget, path, evaluatedValue);
            set(widget, `validationMessages.${path}`, "");
            set(widget, `invalidProps.${path}`, "");
          } else {
            set(widget, path, toString(evaluatedValue));
          }
        }
      });
    }

    // add default value
    Object.keys(widget.defaultProps).map((key: string) => {
      const defaultPropertyValue = get(widget, `${widget.defaultProps[key]}`);

      set(widget, `${key}`, defaultPropertyValue);
    });

    widget.defaultMetaProps.map((key: string) => {
      const metaPropertyValue = get(
        this.props.childMetaProperties,
        `${widget.widgetName}.${key}.${itemIndex}`,
        undefined,
      );

      if (
        typeof metaPropertyValue !== "undefined" &&
        metaPropertyValue !== null
      ) {
        set(widget, key, metaPropertyValue);
      }
    });

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
          const listItem = this.props.listData?.[itemIndex] || {};

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

        if (
          propertyValue.indexOf("currentIndex") > -1 &&
          propertyValue.indexOf("{{((currentIndex) => {") === -1
        ) {
          const { jsSnippets } = getDynamicBindings(propertyValue);

          const newPropertyValue = jsSnippets.reduce(
            (prev: string, next: string) => {
              if (next.indexOf("currentIndex") > -1) {
                return (
                  prev +
                  `{{((currentIndex) => { ${next}})(JSON.parse('${itemIndex}'))}}`
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
    const originalIndex = ((page - 1) * perPage - itemIndex) * -1;

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

    set(widget, `__metaOptions`, {
      widgetName: this.props.widgetName,
      widgetId: this.props.widgetId,
      metaPropPrefix: `childMetaProperties`,
      index: itemIndex,
    });

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

        set(updatedListItemContainer, `disabledResizeHandles`, [
          "left",
          "top",
          "right",
          "bottomRight",
          "topLeft",
          "topRight",
          "bottomLeft",
        ]);

        set(updatedListItemContainer, "ignoreCollision", true);
        set(updatedListItemContainer, "shouldScrollContents", undefined);

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
    const numberOfItemsInGrid = this.props.listData?.length ?? 0;
    if (this.props.children && this.props.children.length > 0) {
      const children = removeFalsyEntries(this.props.children);
      const childCanvas = children[0];

      childCanvas.children = this.getCanvasChildren(
        childCanvas.children.slice(0, 1).shift(),
        numberOfItemsInGrid,
      );
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
        log.error(e);
      }

      return this.renderChild(childCanvas);
    }
  };

  getCanvasChildren = memoizeOne(
    (template: any, count: any) => {
      let canvasChildren = [];
      for (let i = 0; i < count; i++) {
        canvasChildren[i] = JSON.parse(JSON.stringify(template));
      }

      canvasChildren = this.updateGridChildrenProps(canvasChildren);

      return canvasChildren;
    },
    (prev: any, next: any) => {
      return isEqual(prev, next);
    },
  );

  /**
   * 400
   * 200
   * can data be paginated
   */
  shouldPaginate = () => {
    let { gridGap } = this.props;
    const { children, listData } = this.props;
    if (!listData?.length) {
      return { shouldPaginate: false, perPage: 0 };
    }
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
      templateHeight * listData.length +
        parseInt(gridGap) * (listData.length - 1) >
        componentHeight && !this.props.isVirtualized;

    const totalSpaceAvailable =
      componentHeight - (LIST_WIDGET_PAGINATION_HEIGHT + WIDGET_PADDING * 2);
    const spaceTakenByOneContainer =
      templateHeight + (gridGap * (listData.length - 1)) / listData.length;

    const perPage = totalSpaceAvailable / spaceTakenByOneContainer;

    return { shouldPaginate, perPage: isNaN(perPage) ? 0 : floor(perPage) };
  };

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const children = this.renderChildren();
    const { componentHeight } = this.getComponentDimensions();
    const { perPage, shouldPaginate } = this.shouldPaginate();
    const templateBottomRow = get(
      this.props.children,
      "0.children.0.bottomRow",
    );
    const templateHeight =
      templateBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

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

    if (
      Array.isArray(this.props.listData) &&
      this.props.listData.length === 0 &&
      this.props.renderMode === RenderModes.PAGE
    ) {
      return <ListComponentEmpty>No data to display</ListComponentEmpty>;
    }

    if (isNaN(templateHeight) || templateHeight > componentHeight - 45) {
      return (
        <ListComponentEmpty>
          Please make sure the list widget height is greater than the template
          container height.
        </ListComponentEmpty>
      );
    }

    return (
      <ListComponent
        {...this.props}
        hasPagination={shouldPaginate}
        key={`list-widget-page-${this.state.page}`}
        listData={this.props.listData || []}
      >
        {children}

        {shouldPaginate && (
          <ListPagination
            current={this.state.page}
            disabled={false && this.props.renderMode === RenderModes.CANVAS}
            onChange={(page: number) => this.setState({ page })}
            perPage={perPage}
            total={(this.props.listData || []).length}
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
  listData?: Array<Record<string, unknown>>;
  currentItemStructure?: Record<string, string>;
}

export default ListWidget;
export const ProfiledListWidget = Sentry.withProfiler(withMeta(ListWidget));
