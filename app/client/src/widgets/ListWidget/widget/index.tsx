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
  floor,
  isEmpty,
  isEqual,
} from "lodash";
import memoizeOne from "memoize-one";
import shallowEqual from "shallowequal";
import WidgetFactory from "utils/WidgetFactory";
import { removeFalsyEntries } from "utils/helpers";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import ListComponent, {
  ListComponentEmpty,
  ListComponentLoading,
} from "../component";
// import { ContainerStyle } from "components/designSystems/appsmith/ContainerComponent";
// import { ContainerWidgetProps } from "../ContainerWidget";
import propertyPaneConfig from "./propertyConfig";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import ListPagination, {
  ServerSideListPagination,
} from "../component/ListPagination";
import { GridDefaults, WIDGET_PADDING } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import derivedProperties from "./parseDerivedProperties";
import { DSLWidget } from "widgets/constants";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { escapeSpecialChars } from "../../WidgetUtils";
import { PrivateWidgets } from "entities/DataTree/dataTreeFactory";

const LIST_WIDGEY_PAGINATION_HEIGHT = 36;

/* in the List Widget, "children.0.children.0.children.0.children" is the path to the list of all
  widgets present in the List Widget
*/
const PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET =
  "children.0.children.0.children.0.children";
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
      pageSize: `{{(()=>{${derivedProperties.getPageSize}})()}}`,
      selectedItem: `{{(()=>{${derivedProperties.getSelectedItem}})()}}`,
      items: `{{(() => {${derivedProperties.getItems}})()}}`,
      childAutoComplete: `{{(() => {${derivedProperties.getChildAutoComplete}})()}}`,
    };
  }

  componentDidMount() {
    if (this.props.serverSidePaginationEnabled && !this.props.pageNo) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }
    this.props.updateWidgetMetaProperty(
      "templateBottomRow",
      get(this.props.children, "0.children.0.bottomRow"),
    );

    // generate childMetaPropertyMap
    this.generateChildrenDefaultPropertiesMap(this.props);
    this.generateChildrenMetaPropertiesMap(this.props);
    this.generateChildrenEntityDefinitions(this.props);

    // add privateWidgets to ListWidget
    this.addPrivateWidgetsForChildren(this.props);
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
        const widgetType = currentTemplate?.type;

        if (widgetType) {
          childrenEntityDefinitions[widgetType] = Object.keys(
            omit(
              get(entityDefinitions, `${widgetType}`) as Record<
                string,
                unknown
              >,
              ["!doc", "!url"],
            ),
          );
        }
      });
    }

    if (this.props.updateWidgetMetaProperty) {
      this.props.updateWidgetMetaProperty(
        "childrenEntityDefinitions",
        childrenEntityDefinitions,
      );
    }
  }

  // updates the "privateWidgets" field of the List Widget
  addPrivateWidgetsForChildren(props: ListWidgetProps<WidgetProps>) {
    const privateWidgets: PrivateWidgets = {};
    const listWidgetChildren: WidgetProps[] = get(
      props,
      PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET,
    );
    if (!listWidgetChildren) return;
    listWidgetChildren.map((child) => {
      privateWidgets[child.widgetName] = true;
    });

    super.updateWidgetProperty("privateWidgets", privateWidgets);
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
          currentTemplate?.type,
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
          currentTemplate?.type,
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
    const currentListWidgetChildren: WidgetProps[] = get(
      this.props,
      PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET,
    );

    const previousListWidgetChildren: WidgetProps[] = get(
      prevProps,
      PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET,
    );

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

    if (this.props.serverSidePaginationEnabled) {
      if (!this.props.pageNo) this.props.updateWidgetMetaProperty("pageNo", 1);
      // run onPageSizeChange if user resize widgets
      if (
        this.props.onPageSizeChange &&
        this.props.pageSize !== prevProps.pageSize
      ) {
        super.executeAction({
          triggerPropertyName: "onPageSizeChange",
          dynamicString: this.props.onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        });
      }
    }

    if (this.props.serverSidePaginationEnabled) {
      if (
        this.props.serverSidePaginationEnabled === true &&
        prevProps.serverSidePaginationEnabled === false
      ) {
        super.executeAction({
          triggerPropertyName: "onPageSizeChange",
          dynamicString: this.props.onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        });
      }
    }

    if (
      get(this.props.children, "0.children.0.bottomRow") !==
      get(prevProps.children, "0.children.0.bottomRow")
    ) {
      this.props.updateWidgetMetaProperty(
        "templateBottomRow",
        get(this.props.children, "0.children.0.bottomRow"),
        {
          triggerPropertyName: "onPageSizeChange",
          dynamicString: this.props.onPageSizeChange,
          event: {
            type: EventType.ON_PAGE_SIZE_CHANGE,
          },
        },
      );
    }

    // Update privateWidget field if there is a change in the List widget children
    if (!isEqual(currentListWidgetChildren, previousListWidgetChildren)) {
      this.addPrivateWidgetsForChildren(this.props);
    }
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      templateBottomRow: 16,
    };
  }

  onPageChange = (page: number) => {
    this.props.updateWidgetMetaProperty("pageNo", page, {
      triggerPropertyName: "onPageChange",
      dynamicString: this.props.onPageChange,
      event: {
        type: EventType.ON_LIST_PAGE_CHANGE,
      },
    });
  };

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
    childWidgetData.bottomRow = shouldPaginate
      ? componentHeight - LIST_WIDGEY_PAGINATION_HEIGHT
      : componentHeight;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  };

  getGridGap = () =>
    this.props.gridGap && this.props.gridGap >= -8 ? this.props.gridGap : 0;

  /**
   * here we are updating the position of each items and disabled resizing for
   * all items except template ( first item )
   *
   * @param children
   */
  updatePosition = (children: DSLWidget[]): DSLWidget[] => {
    return children.map((child: DSLWidget, index) => {
      const gap = this.getGridGap();

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
          } else if (
            validationPath?.type === ValidationTypes.ARRAY ||
            validationPath?.type === ValidationTypes.OBJECT_ARRAY
          ) {
            const value = Array.isArray(evaluatedValue) ? evaluatedValue : [];
            set(widget, path, value);
          } else {
            set(widget, path, toString(evaluatedValue));
          }
        }
      });
    }

    // add default value
    Object.keys(get(widget, "defaultProps", {})).map((key: string) => {
      const defaultPropertyValue = get(widget, `${widget.defaultProps[key]}`);

      set(widget, `${key}`, defaultPropertyValue);
    });

    get(widget, "defaultMetaProps", []).map((key: string) => {
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
          path.key.includes(`template.${widgetName}`)
            ? path.key.replace(`template.${widgetName}.`, "")
            : undefined,
        ),
      );

      triggerPaths.forEach((path: string) => {
        const propertyValue = get(
          this.props.template[widget.widgetName],
          path,
          "",
        );

        if (
          propertyValue.indexOf("currentItem") > -1 &&
          propertyValue.indexOf("{{((currentItem) => {") === -1
        ) {
          const { jsSnippets } = getDynamicBindings(propertyValue);
          const listItem = this.props.listData?.[itemIndex] || {};
          const stringifiedListItem = JSON.stringify(listItem);
          const escapedStringifiedListItem = escapeSpecialChars(
            stringifiedListItem,
          );
          const newPropertyValue = jsSnippets.reduce(
            (prev: string, next: string) => {
              if (next.indexOf("currentItem") > -1) {
                return (
                  prev +
                  `{{((currentItem) => { ${next}})(JSON.parse('${escapedStringifiedListItem}'))}}`
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
  useNewValues = (children: DSLWidget[]) => {
    const updatedChildren = children.map(
      (listItemContainer: DSLWidget, listItemIndex: number) => {
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

  updateGridChildrenProps = (children: DSLWidget[]) => {
    let updatedChildren = this.useNewValues(children);
    updatedChildren = this.updateActions(updatedChildren);
    updatedChildren = this.paginateItems(updatedChildren);
    updatedChildren = this.updatePosition(updatedChildren);

    return updatedChildren;
  };

  updateActions = (children: DSLWidget[]) => {
    return children.map((child: DSLWidget, index) => {
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
  paginateItems = (children: DSLWidget[]) => {
    // return all children if serverside pagination
    if (this.props.serverSidePaginationEnabled) return children;
    const { page } = this.state;
    const { perPage, shouldPaginate } = this.shouldPaginate();

    if (shouldPaginate) {
      return children.slice((page - 1) * perPage, page * perPage);
    }

    return children;
  };

  /**
   * renders children
   */
  renderChildren = () => {
    if (
      this.props.children &&
      this.props.children.length > 0 &&
      this.props.listData
    ) {
      const { page } = this.state;
      const children = removeFalsyEntries(this.props.children);
      const childCanvas = children[0];

      const canvasChildren = childCanvas.children;
      const template = canvasChildren.slice(0, 1).shift();
      const gridGap = this.getGridGap();
      try {
        // Passing template instead of deriving from canvasChildren becuase lesser items to compare
        // in memoize
        childCanvas.children = this.getCanvasChildren(
          template,
          this.props.listData,
          this.props.template,
          canvasChildren,
          page,
          gridGap,
          this.props.itemBackgroundColor,
        );
      } catch (e) {
        log.error(e);
      }
      return this.renderChild(childCanvas);
    }
  };

  getCanvasChildren = memoizeOne(
    (
      template: any,
      listData: any,
      staticTemplate: any,
      canvasChildren: any,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      page: number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      gridGap,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      itemBackgroundColor,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ) => {
      const canvasChildrenList = [];
      if (listData.length > 0) {
        for (let i = 0; i < listData.length; i++) {
          canvasChildrenList[i] = JSON.parse(JSON.stringify(template));
        }
        canvasChildren = this.updateGridChildrenProps(canvasChildrenList);
      } else {
        canvasChildren = this.updateGridChildrenProps(canvasChildren);
      }

      return canvasChildren;
    },
    (prev: any, next: any) => {
      // not comparing canvasChildren becuase template acts as a proxy

      return (
        shallowEqual(prev[0], next[0]) &&
        shallowEqual(prev[1], next[1]) &&
        shallowEqual(prev[2], next[2]) &&
        prev[3] === next[3] &&
        prev[4] === next[4] &&
        prev[5] === next[6] &&
        prev[6] === next[6]
      );
    },
  );

  /**
   * 400
   * 200
   * can data be paginated
   */
  shouldPaginate = () => {
    let gridGap = this.getGridGap();
    const { children, listData, serverSidePaginationEnabled } = this.props;

    if (serverSidePaginationEnabled) {
      return { shouldPaginate: true, perPage: this.props.pageSize };
    }

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
      componentHeight;

    const totalSpaceAvailable =
      componentHeight - (LIST_WIDGEY_PAGINATION_HEIGHT + WIDGET_PADDING * 2);
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
    const { pageNo, serverSidePaginationEnabled } = this.props;
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
      this.props.listData.filter((item) => !isEmpty(item)).length === 0 &&
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

        {shouldPaginate &&
          (serverSidePaginationEnabled ? (
            <ServerSideListPagination
              nextPageClick={() => this.onPageChange(pageNo + 1)}
              pageNo={this.props.pageNo}
              prevPageClick={() => this.onPageChange(pageNo - 1)}
            />
          ) : (
            <ListPagination
              current={this.state.page}
              disabled={false && this.props.renderMode === RenderModes.CANVAS}
              onChange={(page: number) => this.setState({ page })}
              perPage={perPage}
              total={(this.props.listData || []).length}
            />
          ))}
      </ListComponent>
    );
  }

  /**
   * returns type of the widget
   */
  static getWidgetType(): WidgetType {
    return "LIST_WIDGET";
  }
}

export interface ListWidgetProps<T extends WidgetProps> extends WidgetProps {
  children?: T[];
  shouldScrollContents?: boolean;
  onListItemClick?: string;
  listData?: Array<Record<string, unknown>>;
  currentItemStructure?: Record<string, string>;
}

export default ListWidget;
