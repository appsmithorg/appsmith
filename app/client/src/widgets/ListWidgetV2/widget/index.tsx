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

export type GeneratePseudoWidgetOptions = {
  parentId: string;
  widgetId?: string; // TODO: (Ashit) Remove this
  templateWidget?: WidgetProps & { children?: WidgetProps[] };
  pseudoWidgets?: Template;
  key: string; // TODO: (Ashit) - Make this field optional and use hash of data items
};

type PseudoWidgetIdCache = {
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

  pseudoWidgetIdCache: PseudoWidgetIdCache;
  currentViewPseudoWidgetsRef: Set<string>;

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

    this.pseudoWidgetIdCache = {};
    this.currentViewPseudoWidgetsRef = new Set();
  }

  componentDidMount() {
    if (this.props.serverSidePaginationEnabled && !this.props.pageNo) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }
    this.props.updateWidgetMetaProperty(
      "templateBottomRow",
      get(this.props.childWidgets, "0.children.0.bottomRow"),
    );

    // generate childMetaPropertyMap
    // this.generateChildrenDefaultPropertiesMap(this.props);
    // this.generateChildrenMetaPropertiesMap(this.props);
    this.generateChildrenEntityDefinitions(this.props);

    // add privateWidgets to ListWidget
    this.addPrivateWidgetsForChildren(this.props);

    this.initPseudoWidgets();
  }

  componentDidUpdate(prevProps: ListWidgetProps<WidgetProps>) {
    const currentListWidgetChildren: WidgetProps[] = get(
      this.props,
      PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET,
    );

    this.initPseudoWidgets();

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

    if (
      get(this.props.childWidgets, "0.children.0.bottomRow") !==
      get(prevProps.childWidgets, "0.children.0.bottomRow")
    ) {
      this.props.updateWidgetMetaProperty(
        "templateBottomRow",
        get(this.props.childWidgets, "0.children.0.bottomRow"),
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

  findChildrenIds = (pseudoWidgets: Template, parentId: string) => {
    const ids: string[] = [];

    Object.values(pseudoWidgets).forEach((pseudoWidget) => {
      if (pseudoWidget.parentId === parentId) {
        ids.push(pseudoWidget.widgetId);
      }
    });

    return ids;
  };

  getDeletedPseudoWidgetIds = (newIds: string[]) => {
    const currentIds = [...this.currentViewPseudoWidgetsRef];

    // Present in currentIds but not present in newIds
    return difference(currentIds, newIds);
  };

  updateCurrentViewRefs = (newIds: string[], deletedIds: string[]) => {
    newIds.forEach((id) => this.currentViewPseudoWidgetsRef.add(id));
    deletedIds.forEach((id) => this.currentViewPseudoWidgetsRef.delete(id));
  };

  initPseudoWidgets = () => {
    const pseudoWidgets = this.generatePseudoWidgetsForCurrentView();

    if (pseudoWidgets) {
      const newIds = Object.keys(pseudoWidgets);
      const deletedIds = this.getDeletedPseudoWidgetIds(newIds);
      this.updateCurrentViewRefs(newIds, deletedIds);

      this.modifyPseudoWidgets({
        addOrUpdate: pseudoWidgets,
        delete: deletedIds,
      });
    }
  };

  generatePseudoWidgetsForCurrentView = () => {
    const { page } = this.state;
    const { pageSize, listData = [], mainCanvasId } = this.props;
    const startIndex = pageSize * (page - 1);
    const currentViewData = listData.slice(startIndex, startIndex + pageSize);
    const itemsCount = currentViewData.length;

    let generatedPseudoWidgets: Record<string, FlattenedWidgetProps> = {};
    const canvasChildrenIds: string[] = [];
    if (itemsCount > 0) {
      Array.from(Array(itemsCount).keys()).forEach((idx) => {
        const index = startIndex + idx;
        const data = currentViewData[idx];
        const key = String(data["id"]);
        const { pseudoWidgetId, pseudoWidgets } = this.computePseudoWidgets(
          index,
          key,
        );

        generatedPseudoWidgets = {
          ...generatedPseudoWidgets,
          ...pseudoWidgets,
        };

        canvasChildrenIds.push(pseudoWidgetId);
      });

      if (mainCanvasId) {
        generatedPseudoWidgets[mainCanvasId] = this.mainCanvasPseudoWidget();
        generatedPseudoWidgets[mainCanvasId].children = this.findChildrenIds(
          generatedPseudoWidgets,
          mainCanvasId,
        );
      }

      return generatedPseudoWidgets;
    }
  };

  getBinding = (value: string, widgetName: string) => {
    const { jsSnippets, stringSegments } = getDynamicBindings(value);

    const js = combineDynamicBindings(jsSnippets, stringSegments);

    return `{{((currentItem) => ${js})(${this.props.widgetName}.listData[${widgetName}.__index])}}`;
  };

  disableWidgetOperations = (pseudoWidget: FlattenedWidgetProps) => {
    set(pseudoWidget, "resizeDisabled", true);
    set(pseudoWidget, "disablePropertyPane", true);
    set(pseudoWidget, "dragDisabled", true);
    set(pseudoWidget, "dropDisabled", true);

    set(pseudoWidget, "ignoreCollision", true);
    set(pseudoWidget, "shouldScrollContents", undefined);

    set(pseudoWidget, `disabledResizeHandles`, [
      "left",
      "top",
      "right",
      "bottomRight",
      "topLeft",
      "topRight",
      "bottomLeft",
    ]);
  };

  getMainContainer = () => this.props.childWidgets?.[0]?.children?.[0];

  updateContainerPosition = (
    pseudoContainerWidget: FlattenedWidgetProps,
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

    pseudoContainerWidget.gap = gap;
    pseudoContainerWidget.backgroundColor = itemBackgroundColor;
    pseudoContainerWidget.borderRadius = borderRadius;
    pseudoContainerWidget.boxShadow = boxShadow;
    pseudoContainerWidget.boxShadowColor = boxShadowColor;
    pseudoContainerWidget.topRow =
      index * mainContainerWidget.bottomRow +
      index * (gap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
    pseudoContainerWidget.bottomRow =
      (index + 1) * mainContainerWidget.bottomRow +
      index * (gap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
  };

  // TODO: (ashit) - When key becomes part of property config, remove from here
  // and access directly from this.props
  getPseudoWidgetId = (widgetId: string, key: string) => {
    if (!this.pseudoWidgetIdCache[key]) {
      this.pseudoWidgetIdCache[key] = {};
    }

    const pseudoWidgetId =
      this.pseudoWidgetIdCache[key]?.[widgetId] || generateReactKey();

    this.pseudoWidgetIdCache[key][widgetId] = pseudoWidgetId;

    return pseudoWidgetId;
  };

  generatePseudoWidget = (
    index: number,
    options: GeneratePseudoWidgetOptions,
  ) => {
    const {
      // template,
      dynamicPathMap = {},
      widgetName,
      mainContainerId,
      pageSize,
      renderMode,
    } = this.props;
    const { page } = this.state;
    const { parentId, pseudoWidgets = {}, key, templateWidget } = options;

    if (!templateWidget) return { pseudoWidgets, pseudoWidgetId: "" };
    const pseudoWidget = klona(
      omit(templateWidget, "children"),
    ) as FlattenedWidgetProps;
    const dynamicPaths = dynamicPathMap[templateWidget.widgetId] || [];
    const viewIndex = index - pageSize * (page - 1);

    if (
      renderMode === RenderModes.PAGE ||
      (renderMode === RenderModes.CANVAS && viewIndex !== 0)
    ) {
      this.disableWidgetOperations(pseudoWidget);

      const pseudoWidgetId = this.getPseudoWidgetId(
        templateWidget.widgetId,
        key,
      );

      pseudoWidget.widgetId = pseudoWidgetId;
      pseudoWidget.widgetName = `${widgetName}_${templateWidget.widgetName}_${pseudoWidget.widgetId}`;
    }

    if (templateWidget.widgetId === mainContainerId) {
      this.updateContainerPosition(pseudoWidget, viewIndex);
    }

    pseudoWidget.__index = index;
    pseudoWidget.parentId = parentId;

    dynamicPaths.forEach((dynamicPath) => {
      const templateValue = get(templateWidget, dynamicPath);
      const dynamicValue = this.getBinding(
        templateValue,
        pseudoWidget.widgetName,
      );

      set(pseudoWidget, dynamicPath, dynamicValue);
    });

    const children: string[] = [];

    (templateWidget.children || []).map((childWidget) => {
      const { pseudoWidgetId: pseudoChildWidgetId } = this.generatePseudoWidget(
        index,
        {
          parentId: pseudoWidget.widgetId,
          pseudoWidgets,
          templateWidget: childWidget,
          key,
        },
      );
      // const idMap = this.pseudoWidgetIdCache[key] || {};

      // children.push(idMap[childWidget.widgetId] || childWidget.widgetId);
      children.push(pseudoChildWidgetId);
    });

    pseudoWidget.children = children;

    pseudoWidgets[pseudoWidget.widgetId] = pseudoWidget;

    return {
      pseudoWidgets,
      pseudoWidgetId: pseudoWidget.widgetId,
    };
  };

  computePseudoWidgets = (index: number, key: string) => {
    const {
      mainCanvasId = "",
      // mainContainerId = "",
      childWidgets = [],
    } = this.props;
    const containerWidget: WidgetProps = childWidgets[0]?.children?.[0];

    return this.generatePseudoWidget(index, {
      parentId: mainCanvasId,
      templateWidget: containerWidget,
      key,
    });
  };

  mainCanvasPseudoWidget = () => {
    const { childWidgets = [] } = this.props;
    const mainCanvasWidget = omit(
      childWidgets[0],
      "children",
    ) as FlattenedWidgetProps;
    const { shouldPaginate } = this.shouldPaginate();
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    const pseudoMainCanvas = klona(mainCanvasWidget) ?? {};

    pseudoMainCanvas.canExtend = undefined;
    pseudoMainCanvas.isVisible = this.props.isVisible;
    pseudoMainCanvas.minHeight = componentHeight;
    pseudoMainCanvas.rightColumn = componentWidth;
    pseudoMainCanvas.noPad = true;
    pseudoMainCanvas.bottomRow = shouldPaginate
      ? componentHeight - LIST_WIDGET_PAGINATION_HEIGHT
      : componentHeight;

    return pseudoMainCanvas;
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
    return (this.props.pseudoWidgetChildrenStructure || []).map(
      (childWidgetStructure) => {
        const child = { ...childWidgetStructure };
        child.parentColumnSpace = this.props.parentColumnSpace;
        // This gets replaced in withWidgetProps.
        child.rightColumn = componentWidth;
        return WidgetFactory.createWidget(child, this.props.renderMode);
      },
    );
  };

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const { componentHeight } = this.getComponentDimensions();
    const { pageNo, serverSidePaginationEnabled } = this.props;
    const { perPage, shouldPaginate } = this.shouldPaginate();
    const templateBottomRow = get(
      this.props.childWidgets,
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
}

export default ListWidget;
