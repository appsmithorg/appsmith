import React from "react";
import log from "loglevel";
import {
  get,
  set,
  xor,
  isNumber,
  range,
  omit,
  isEmpty,
  isEqual,
  difference,
} from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import BaseWidget, { WidgetProps } from "widgets/BaseWidget";
import { RenderModes, WidgetType } from "constants/WidgetConstants";
import ListComponent, {
  ListComponentEmpty,
  ListComponentLoading,
} from "../component";
import propertyPaneConfig from "./propertyConfig";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  combineDynamicBindings,
  EVALUATION_PATH,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import ListPagination, {
  ServerSideListPagination,
} from "../component/ListPagination";
import { GridDefaults } from "constants/WidgetConstants";
import derivedProperties from "./parseDerivedProperties";
import { DSLWidget, FlattenedWidgetProps } from "widgets/constants";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { PrivateWidgets } from "entities/DataTree/dataTreeFactory";
import { klona } from "klona";
import { generateReactKey } from "utils/generators";

export type DynamicPathList = Record<string, string[]>;

export type Template = Record<string, FlattenedWidgetProps>;

export type GenerateMetaWidgetOptions = {
  parentId: string;
  widgetId?: string; // TODO: (Ashit) Remove this
  templateWidgetId?: string;
  metaWidgets?: Template;
  key: string; // TODO: (Ashit) - Make this field optional and use hash of data items
  widgetUpdateMap?: Record<string, boolean>;
  prevChildCanvasWidget: ListWidgetProps<WidgetProps>["childCanvasWidgets"];
};

type MetaWidgetIdCache = {
  [key: string]: Record<string, string>;
};

type ListWidgetState = {
  page: number;
};

const LIST_WIDGET_PAGINATION_HEIGHT = 36;

/* in the List Widget, "children.0.children.0.children.0.children" is the path to the list of all
  widgets present in the List Widget
*/
const PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET =
  "children.0.children.0.children.0.children";

class ListWidget extends BaseWidget<
  ListWidgetProps<WidgetProps>,
  ListWidgetState
> {
  state = {
    page: 1,
  };

  metaWidgetIdCache: MetaWidgetIdCache;
  currentViewMetaWidgetsRef: Set<string>;

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

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      templateBottomRow: 16,
    };
  }

  constructor(
    props:
      | ListWidgetProps<WidgetProps>
      | Readonly<ListWidgetProps<WidgetProps>>,
  ) {
    super(props);

    this.metaWidgetIdCache = {};
    this.currentViewMetaWidgetsRef = new Set();
  }

  componentDidMount() {
    if (this.props.serverSidePaginationEnabled && !this.props.pageNo) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }
    this.props.updateWidgetMetaProperty(
      "templateBottomRow",
      this.getMainContainer()?.bottomRow,
    );

    // generate childMetaPropertyMap
    // this.generateChildrenDefaultPropertiesMap(this.props);
    // this.generateChildrenMetaPropertiesMap(this.props);
    this.generateChildrenEntityDefinitions(this.props);

    // add privateWidgets to ListWidget
    this.addPrivateWidgetsForChildren(this.props);

    this.initMetaWidgets();
  }

  componentDidUpdate(prevProps: ListWidgetProps<WidgetProps>) {
    const currentListWidgetChildren: WidgetProps[] = get(
      this.props,
      PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET,
    );

    this.initMetaWidgets(prevProps.childCanvasWidgets);

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
      // this.generateChildrenDefaultPropertiesMap(this.props);
      // this.generateChildrenMetaPropertiesMap(this.props);
      // this.generateChildrenEntityDefinitions(this.props);
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

    // if (
    //   get(this.props.childWidgets, "0.children.0.bottomRow") !==
    //   get(prevProps.childWidgets, "0.children.0.bottomRow")
    // ) {
    //   this.props.updateWidgetMetaProperty(
    //     "templateBottomRow",
    //     get(this.props.childWidgets, "0.children.0.bottomRow"),
    //     {
    //       triggerPropertyName: "onPageSizeChange",
    //       dynamicString: this.props.onPageSizeChange,
    //       event: {
    //         type: EventType.ON_PAGE_SIZE_CHANGE,
    //       },
    //     },
    //   );
    // }

    // Update privateWidget field if there is a change in the List widget children
    if (!isEqual(currentListWidgetChildren, previousListWidgetChildren)) {
      this.addPrivateWidgetsForChildren(this.props);
    }
  }

  flattenWidget = (
    canvasWidget?: WidgetProps & { children?: WidgetProps[] },
    isRecursive = true,
    flattenedWidgets: Record<string, FlattenedWidgetProps> = {},
  ) => {
    if (!canvasWidget) return flattenedWidgets;
    const widget = {
      ...omit(canvasWidget, ["children", EVALUATION_PATH]),
    } as FlattenedWidgetProps;
    const childrenIds: string[] = [];

    (canvasWidget.children || []).forEach((childWidget) => {
      childrenIds.push(childWidget.widgetId);

      if (isRecursive) {
        this.flattenWidget(childWidget, isRecursive, flattenedWidgets);
      }
    });

    widget.children = childrenIds;

    flattenedWidgets[canvasWidget.widgetId] = widget;

    return flattenedWidgets;
  };

  // findChildrenIds = (metaWidgets: Template, parentId: string) => {
  //   const ids: string[] = [];

  //   Object.values(metaWidgets).forEach((metaWidget) => {
  //     if (metaWidget.parentId === parentId) {
  //       ids.push(metaWidget.widgetId);
  //     }
  //   });

  //   return ids;
  // };

  getDeletedAndAddedMetaWidgetIds = () => {
    let currentIds: string[] = [];
    const { page } = this.state;
    const { pageSize, listData = [], mainCanvasId = "" } = this.props;
    const startIndex = pageSize * (page - 1);
    const currentViewData = listData.slice(startIndex, startIndex + pageSize);

    currentViewData.forEach((datum) => {
      const key = String(datum["id"]);
      const map = this.metaWidgetIdCache[key] || {};
      currentIds = [...currentIds, ...Object.values(map)];
    });

    currentIds.push(mainCanvasId);

    const prevIds = [...this.currentViewMetaWidgetsRef];

    // Present in currentIds but not present in newIds
    return {
      deletedIds: difference(prevIds, currentIds),
      addedIds: difference(currentIds, prevIds),
    };
  };

  updateCurrentViewRefs = (newIds: string[], deletedIds: string[]) => {
    newIds.forEach((id) => this.currentViewMetaWidgetsRef.add(id));
    deletedIds.forEach((id) => this.currentViewMetaWidgetsRef.delete(id));
  };

  initMetaWidgets = (
    prevChildCanvasWidget?: ListWidgetProps<WidgetProps>["childCanvasWidgets"],
  ) => {
    const metaWidgets = this.generateMetaWidgetsForCurrentView(
      prevChildCanvasWidget,
    );

    if (metaWidgets) {
      const { addedIds, deletedIds } = this.getDeletedAndAddedMetaWidgetIds();
      this.updateCurrentViewRefs(addedIds, deletedIds);

      this.modifyMetaWidgets({
        addOrUpdate: metaWidgets,
        delete: deletedIds,
      });
    }
  };

  generateMetaWidgetsForCurrentView = (
    prevChildCanvasWidget: ListWidgetProps<WidgetProps>["childCanvasWidgets"],
  ) => {
    const { page } = this.state;
    const { pageSize, listData = [], mainCanvasId } = this.props;
    const startIndex = pageSize * (page - 1);
    const currentViewData = listData.slice(startIndex, startIndex + pageSize);
    const itemsCount = currentViewData.length;

    let generatedMetaWidgets: Record<string, FlattenedWidgetProps> = {};
    const canvasChildrenIds: string[] = [];
    if (itemsCount > 0) {
      Array.from(Array(itemsCount).keys()).forEach((idx) => {
        const index = startIndex + idx;
        const data = currentViewData[idx];
        const key = String(data["id"]);
        const { metaWidgetId, metaWidgets } = this.computeMetaWidgets(
          index,
          key,
          prevChildCanvasWidget,
        );

        generatedMetaWidgets = {
          ...generatedMetaWidgets,
          ...metaWidgets,
        };

        canvasChildrenIds.push(metaWidgetId);
      });

      // Experimental change, original commented below
      if (mainCanvasId) {
        generatedMetaWidgets[mainCanvasId] = this.mainCanvasMetaWidget();
        generatedMetaWidgets[mainCanvasId].children = canvasChildrenIds;
      }

      // if (mainCanvasId && !this.currentViewMetaWidgetsRef.has(mainCanvasId)) {
      //   generatedMetaWidgets[mainCanvasId] = this.mainCanvasMetaWidget();
      //   generatedMetaWidgets[mainCanvasId].children = canvasChildrenIds;
      // }

      return generatedMetaWidgets;
    }
  };

  getBinding = (value: string, widgetName: string) => {
    const { jsSnippets, stringSegments } = getDynamicBindings(value);

    const js = combineDynamicBindings(jsSnippets, stringSegments);

    return `{{((currentItem) => ${js})(${this.props.widgetName}.listData[${widgetName}.__index])}}`;
  };

  disableWidgetOperations = (metaWidget: FlattenedWidgetProps) => {
    set(metaWidget, "resizeDisabled", true);
    set(metaWidget, "disablePropertyPane", true);
    set(metaWidget, "dragDisabled", true);
    set(metaWidget, "dropDisabled", true);

    set(metaWidget, "ignoreCollision", true);
    set(metaWidget, "shouldScrollContents", undefined);

    set(metaWidget, `disabledResizeHandles`, [
      "left",
      "top",
      "right",
      "bottomRight",
      "topLeft",
      "topRight",
      "bottomLeft",
    ]);
  };

  getMainContainer = () => {
    const { mainContainerId = "", childCanvasWidgets = {} } = this.props;
    return childCanvasWidgets[mainContainerId] || {};
  };

  updateContainerPosition = (
    metaContainerWidget: FlattenedWidgetProps,
    index: number,
  ) => {
    // TODO (ASHIT) - Remove mainContainerId?
    // const { mainContainerId = "", template } = this.props;
    const mainContainerWidget = this.getMainContainer();
    const gap = this.getGridGap();
    const {
      borderRadius,
      boxShadow,
      boxShadowColor,
      itemBackgroundColor,
    } = this.props;

    metaContainerWidget.gap = gap;
    metaContainerWidget.backgroundColor = itemBackgroundColor;
    metaContainerWidget.borderRadius = borderRadius;
    metaContainerWidget.boxShadow = boxShadow;
    metaContainerWidget.boxShadowColor = boxShadowColor;
    metaContainerWidget.topRow =
      index * mainContainerWidget.bottomRow +
      index * (gap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
    metaContainerWidget.bottomRow =
      (index + 1) * mainContainerWidget.bottomRow +
      index * (gap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
  };

  // TODO: (ashit) - When key becomes part of property config, remove from here
  // and access directly from this.props
  getMetaWidgetId = (widgetId: string, key: string, viewIndex: number) => {
    if (!this.metaWidgetIdCache[key]) {
      this.metaWidgetIdCache[key] = {};
    }

    const metaWidgetId = this.isClonedItem(viewIndex)
      ? this.metaWidgetIdCache[key]?.[widgetId] || generateReactKey()
      : widgetId;

    this.metaWidgetIdCache[key][widgetId] = metaWidgetId;

    return metaWidgetId;
  };

  cloneTemplateWidget = (templateWidgetId: string) => {
    const templateWidget = this.props?.childCanvasWidgets?.[templateWidgetId];
    const clonedWidget = klona(
      omit(templateWidget, [EVALUATION_PATH]),
    ) as FlattenedWidgetProps;

    return clonedWidget;
  };

  isClonedItem = (viewIndex: number) => {
    const { renderMode } = this.props;

    return (
      renderMode === RenderModes.PAGE ||
      (renderMode === RenderModes.CANVAS && viewIndex !== 0)
    );
  };

  generateMetaWidget = (index: number, options: GenerateMetaWidgetOptions) => {
    const {
      // template,
      dynamicPathMap = {},
      widgetName,
      mainContainerId,
      pageSize,
      renderMode,
      childCanvasWidgets = {},
    } = this.props;
    const { page } = this.state;
    const {
      parentId,
      metaWidgets = {},
      key,
      templateWidgetId = "",
      prevChildCanvasWidget = {},
      widgetUpdateMap = {},
    } = options;
    const templateWidget = childCanvasWidgets[templateWidgetId];

    if (!templateWidget) return { metaWidgets, metaWidgetId: "" };

    const metaWidget = klona(templateWidget);
    const dynamicPaths = dynamicPathMap[templateWidgetId] || [];
    const viewIndex = index - pageSize * (page - 1);
    const isCloneItem =
      renderMode === RenderModes.PAGE ||
      (renderMode === RenderModes.CANVAS && viewIndex !== 0);
    const metaWidgetId = this.getMetaWidgetId(templateWidgetId, key, viewIndex);
    const children: string[] = [];

    (templateWidget.children || []).map((childWidgetId: string) => {
      const { metaWidgetId: metaChildWidgetId } = this.generateMetaWidget(
        index,
        {
          parentId: metaWidgetId,
          metaWidgets,
          templateWidgetId: childWidgetId,
          key,
          prevChildCanvasWidget,
        },
      );

      children.push(metaChildWidgetId);
    });

    metaWidget.children = children;

    if (templateWidgetId in widgetUpdateMap) {
      const isEqual = widgetUpdateMap[templateWidgetId];

      if (isEqual) return { metaWidgets, metaWidgetId };
    } else {
      // const isEqual = equal(
      //   templateWidget,
      //   prevChildCanvasWidget[templateWidgetId],
      // );
      const isEqual =
        templateWidget === prevChildCanvasWidget[templateWidgetId];

      widgetUpdateMap[templateWidgetId] = isEqual;

      if (isEqual && this.currentViewMetaWidgetsRef.has(metaWidgetId)) {
        return { metaWidgets, metaWidgetId };
      }
    }

    if (isCloneItem) {
      this.disableWidgetOperations(metaWidget);

      metaWidget.widgetId = metaWidgetId;
      metaWidget.widgetName = `${widgetName}_${templateWidget.widgetName}_${metaWidget.widgetId}`;
    }

    if (templateWidgetId === mainContainerId) {
      this.updateContainerPosition(metaWidget, viewIndex);
    }

    metaWidget.__index = index;
    metaWidget.parentId = parentId;

    dynamicPaths.forEach((dynamicPath) => {
      const templateValue = get(templateWidget, dynamicPath);
      const dynamicValue = this.getBinding(
        templateValue,
        metaWidget.widgetName,
      );

      set(metaWidget, dynamicPath, dynamicValue);
    });

    metaWidgets[metaWidget.widgetId] = metaWidget;

    return {
      metaWidgets,
      metaWidgetId,
    };
  };

  computeMetaWidgets = (
    index: number,
    key: string,
    prevChildCanvasWidget: ListWidgetProps<WidgetProps>["childCanvasWidgets"],
  ) => {
    const { mainCanvasId = "", mainContainerId } = this.props;

    return this.generateMetaWidget(index, {
      parentId: mainCanvasId,
      templateWidgetId: mainContainerId,
      key,
      prevChildCanvasWidget,
    });
  };

  mainCanvasMetaWidget = () => {
    const { childCanvasWidgets = {}, mainCanvasId = "" } = this.props;
    const mainCanvasWidget = childCanvasWidgets[mainCanvasId] || {};
    const { shouldPaginate } = this.shouldPaginate();
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    const metaMainCanvas = klona(mainCanvasWidget) ?? {};

    metaMainCanvas.canExtend = undefined;
    metaMainCanvas.isVisible = this.props.isVisible;
    metaMainCanvas.minHeight = componentHeight;
    metaMainCanvas.rightColumn = componentWidth;
    metaMainCanvas.noPad = true;
    metaMainCanvas.bottomRow = shouldPaginate
      ? componentHeight - LIST_WIDGET_PAGINATION_HEIGHT
      : componentHeight;

    return metaMainCanvas;
  };

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

  onPageChange = (page: number) => {
    const currentPage = this.props.pageNo;
    const eventType =
      currentPage > page ? EventType.ON_PREV_PAGE : EventType.ON_NEXT_PAGE;
    this.props.updateWidgetMetaProperty("pageNo", page, {
      triggerPropertyName: "onPageChange",
      dynamicString: this.props.onPageChange,
      event: {
        type: eventType,
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
      const rowData = this.props.listData?.[rowIndex];
      const { jsSnippets } = getDynamicBindings(action);
      const modifiedAction = jsSnippets.reduce((prev: string, next: string) => {
        return prev + `{{${next}}} `;
      }, "");

      super.executeAction({
        dynamicString: modifiedAction,
        event: {
          type: EventType.ON_CLICK,
        },
        globalContext: { currentItem: rowData },
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
      ? componentHeight - LIST_WIDGET_PAGINATION_HEIGHT
      : componentHeight;

    return WidgetFactory.createWidget(childWidgetData, this.props.renderMode);
  };

  getGridGap = () =>
    this.props.gridGap && this.props.gridGap >= -8 ? this.props.gridGap : 0;

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
   * 400
   * 200
   * can data be paginated
   */
  shouldPaginate = () => {
    const { listData, pageSize, serverSidePaginationEnabled } = this.props;

    if (serverSidePaginationEnabled) {
      return { shouldPaginate: true, perPage: pageSize };
    }

    if (!listData?.length) {
      return { shouldPaginate: false, perPage: 0 };
    }

    const shouldPaginate = pageSize < listData.length;

    return { shouldPaginate, perPage: pageSize };
  };

  renderChildren = () => {
    const { componentWidth } = this.getComponentDimensions();
    return (this.props.metaWidgetChildrenStructure || []).map(
      (childWidgetStructure) => {
        const child = { ...childWidgetStructure };
        child.parentColumnSpace = this.props.parentColumnSpace;
        // This gets replaced in withWidgetProps.
        child.rightColumn = componentWidth;
        return WidgetFactory.createWidget(child, this.props.renderMode);
      },
    );
  };

  onClientPageChange = (page: number) => this.setState({ page });

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const { componentHeight } = this.getComponentDimensions();
    const { pageNo, serverSidePaginationEnabled } = this.props;
    const { perPage, shouldPaginate } = this.shouldPaginate();
    const mainChildContainer = this.getMainContainer();
    const templateBottomRow = mainChildContainer.bottomRow;
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
        backgroundColor={this.props.backgroundColor}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        hasPagination={shouldPaginate}
        key={`list-widget-page-${this.state.page}`}
        listData={this.props.listData || []}
      >
        {this.renderChildren()}
        {shouldPaginate &&
          (serverSidePaginationEnabled ? (
            <ServerSideListPagination
              nextPageClick={() => this.onPageChange(pageNo + 1)}
              pageNo={this.props.pageNo}
              prevPageClick={() => this.onPageChange(pageNo - 1)}
            />
          ) : (
            <ListPagination
              accentColor={this.props.accentColor}
              borderRadius={this.props.borderRadius}
              boxShadow={this.props.boxShadow}
              current={this.state.page}
              disabled={false && this.props.renderMode === RenderModes.CANVAS}
              onChange={this.onClientPageChange}
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
    return "LIST_WIDGET_V2";
  }
}

export interface ListWidgetProps<T extends WidgetProps> extends WidgetProps {
  accentColor: string;
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  children?: T[];
  currentItemStructure?: Record<string, string>;
  dynamicPathMap?: Record<string, string[]>;
  mainCanvasId?: string;
  listData?: Array<Record<string, unknown>>;
  mainContainerId?: string;
  onListItemClick?: string;
  shouldScrollContents?: boolean;
  template: Template;
  childCanvasWidgets?: Record<string, FlattenedWidgetProps>;
}

export default ListWidget;
