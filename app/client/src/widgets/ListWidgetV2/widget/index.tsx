import equal from "fast-deep-equal/es6";
import log from "loglevel";
import React, { createRef, RefObject } from "react";
import { Virtualizer } from "@tanstack/virtual-core";
import { get, isNumber, range, omit, isEmpty, floor } from "lodash";
import { klona } from "klona";

import derivedProperties from "./parseDerivedProperties";
import MetaWidgetContextProvider from "../../MetaWidgetContextProvider";
import MetaWidgetGenerator, { GeneratorOptions } from "../MetaWidgetGenerator";
import propertyPaneConfig from "./propertyConfig";
import WidgetFactory from "utils/WidgetFactory";
import { BatchPropertyUpdatePayload } from "actions/controlActions";
import {
  CanvasWidgetStructure,
  DSLWidget,
  FlattenedWidgetProps,
} from "widgets/constants";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { PrivateWidgets } from "entities/DataTree/dataTreeFactory";
import {
  GridDefaults,
  RenderModes,
  WidgetType,
} from "constants/WidgetConstants";
import BaseWidget, { WidgetOperation, WidgetProps } from "widgets/BaseWidget";
import ListComponent, {
  ListComponentEmpty,
  ListComponentLoading,
} from "../component";
import {
  EventType,
  ExecuteTriggerPayload,
} from "constants/AppsmithActionConstants/ActionConstants";
import ListPagination, {
  ServerSideListPagination,
} from "../component/ListPagination";
import { ModifyMetaWidgetPayload } from "reducers/entityReducers/metaWidgetsReducer";

export enum DynamicPathType {
  CURRENT_ITEM = "currentItem",
  CURRENT_INDEX = "currentIndex",
  CURRENT_ROW = "currentRow",
  LEVEL = "level",
}
export type DynamicPathMap = Record<string, DynamicPathType[]>;
export type DynamicPathMapList = Record<string, DynamicPathMap>;

export type MetaWidgets = Record<string, MetaWidget>;
export type MetaWidget = FlattenedWidgetProps & {
  currentIndex: number;
  currentRow: string;
  currentItem: string;
};

export type LevelData = {
  [level: string]: {
    currentIndex: number;
    currentItem: string;
    currentRowCache: MetaWidgetRowCache;
  };
};

export type MetaWidgetCacheProps = {
  entityDefinition: Record<string, string>;
  index: number;
  metaWidgetId: string;
  metaWidgetName: string;
  rowIndex: number;
  templateWidgetId: string;
  templateWidgetName: string;
  type: string;
};

export type MetaWidgetRowCache = Record<string, MetaWidgetCacheProps>;

export type MetaWidgetCache = {
  [key: string]: MetaWidgetRowCache | undefined;
};

type ListWidgetState = {
  page: number;
};

type ExtendedCanvasWidgetStructure = CanvasWidgetStructure & {
  canExtend?: boolean;
  shouldScrollContents?: boolean;
};

type VirtualizerInstance = Virtualizer<HTMLDivElement, HTMLDivElement>;

const LIST_WIDGET_PAGINATION_HEIGHT = 36;

/* in the List Widget, "children.0.children.0.children.0.children" is the path to the list of all
  widgets present in the List Widget
*/
const PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET =
  "children.0.children.0.children.0.children";

class ListWidget extends BaseWidget<ListWidgetProps, ListWidgetState> {
  state = {
    page: 1,
  };

  componentRef: RefObject<HTMLDivElement>;
  metaWidgetGenerator: MetaWidgetGenerator;
  prevFlattenedChildCanvasWidgets?: Record<string, FlattenedWidgetProps>;
  prevMetaContainerNames: string[];
  prevMetaMainCanvasWidget?: MetaWidget;
  virtualizer?: VirtualizerInstance;

  /**
   * returns the property pane config of the widget
   */
  static getPropertyPaneConfig() {
    return propertyPaneConfig;
  }

  static getDerivedPropertiesMap() {
    return {
      // pageSize: `{{(()=>{${derivedProperties.getPageSize}})()}}`,
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
      currentViewItems: "{{[]}}",
    };
  }

  constructor(props: ListWidgetProps | Readonly<ListWidgetProps>) {
    super(props);
    const { referencedWidgetId, widgetId } = props;
    const isListCloned =
      Boolean(referencedWidgetId) && referencedWidgetId !== widgetId;

    this.metaWidgetGenerator = new MetaWidgetGenerator({
      renderMode: props.renderMode,
      // eslint-disable-next-line
      // @ts-ignore
      getWidgetCache: this.getWidgetCache,
      setWidgetCache: this.setWidgetCache,
      infiniteScroll: props.infiniteScroll ?? false,
      isListCloned,
      level: props.level || 1,
      onVirtualListScroll: this.generateMetaWidgets,
      widgetId: props.widgetId,
    });
    this.prevMetaContainerNames = [];
    this.componentRef = createRef<HTMLDivElement>();
  }

  componentDidMount() {
    const generatorOptions = this.metaWidgetGeneratorOptions();
    // Mounts the virtualizer
    this.metaWidgetGenerator.withOptions(generatorOptions).didMount();

    if (this.props.infiniteScroll) {
      this.generateMetaWidgets();
    }

    if (this.props.serverSidePaginationEnabled && !this.props.pageNo) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }

    this.generateChildrenEntityDefinitions(this.props);

    // add privateWidgets to ListWidget
    this.addPrivateWidgetsForChildren(this.props);
    this.setupMetaWidgets();
  }

  componentDidUpdate(prevProps: ListWidgetProps) {
    this.prevFlattenedChildCanvasWidgets =
      prevProps.flattenedChildCanvasWidgets;

    // TODO
    if (this.hasTemplateBottomRowChanged()) {
      if (this.virtualizer) {
        this.virtualizer.measure();
        this.virtualizer._didMount()();
        this.virtualizer._willUpdate();
      }
    }

    this.setupMetaWidgets(prevProps);

    // TODO:Fix
    // if (this.props.serverSidePaginationEnabled) {
    //   if (!this.props.pageNo) this.props.updateWidgetMetaProperty("pageNo", 1);
    //   // run onPageSizeChange if user resize widgets
    //   if (
    //     this.props.onPageSizeChange &&
    //     this.props.pageSize !== prevProps.pageSize
    //   ) {
    //     super.executeAction({
    //       triggerPropertyName: "onPageSizeChange",
    //       dynamicString: this.props.onPageSizeChange,
    //       event: {
    //         type: EventType.ON_PAGE_SIZE_CHANGE,
    //       },
    //     });
    //   }
    // }

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
  }

  componentWillUnmount() {
    this.deleteMetaWidgets();
  }

  setupMetaWidgets = (prevProps?: ListWidgetProps) => {
    // TODO: (ashit) Check for type === SKELETON_WIDGET?
    // Only when infinite scroll is not toggled i.e on !-> off or off !-> on
    if (this.props.infiniteScroll && prevProps?.infiniteScroll) {
      this.metaWidgetGenerator.recalculateVirtualList(() => {
        return (
          this.props.gridGap !== prevProps.gridGap ||
          // eslint-disable-next-line
          this.props.flattenedChildCanvasWidgets !==
            prevProps.flattenedChildCanvasWidgets ||
          this.props.listData?.length !== prevProps?.listData?.length ||
          this.props.bottomRow !== prevProps.bottomRow
        );
      });
    } else {
      this.generateMetaWidgets();
    }
  };

  metaWidgetGeneratorOptions = (): GeneratorOptions => {
    const { page } = this.state;
    const {
      dynamicPathMapList = {},
      flattenedChildCanvasWidgets = {},
      listData = [],
      mainCanvasId = "",
      mainContainerId = "",
      primaryKey,
    } = this.props;

    const primaryKeys = (() => {
      if (Array.isArray(primaryKey)) {
        return primaryKey;
      }

      if (typeof primaryKey === "string") {
        return listData.map((d) => {
          const keyValue = d[primaryKey];
          if (typeof keyValue === "string" || typeof keyValue === "number") {
            return keyValue;
          }

          return;
        });
      }

      return [];
    })();

    return {
      containerParentId: mainCanvasId,
      containerWidgetId: mainContainerId,
      currTemplateWidgets: flattenedChildCanvasWidgets,
      data: listData,
      dynamicPathMapList,
      gridGap: this.getGridGap(),
      infiniteScroll: this.props.infiniteScroll ?? false,
      levelData: this.props.levelData,
      prevTemplateWidgets: this.prevFlattenedChildCanvasWidgets,
      primaryKeys,
      scrollElement: this.componentRef.current,
      templateBottomRow: this.getTemplateBottomRow(),
      widgetName: this.props.widgetName,
      pageNo: page,
      pageSize: this.getPageSize(),
    };
  };

  generateMetaWidgets = () => {
    const generatorOptions = this.metaWidgetGeneratorOptions();

    const {
      metaWidgets,
      removedMetaWidgetIds,
    } = this.metaWidgetGenerator.withOptions(generatorOptions).generate();

    this.updateCurrentViewItemsBinding();
    const mainCanvasWidget = this.generateMainMetaCanvasWidget();
    this.syncMetaContainerNames();

    const updates: ModifyMetaWidgetPayload = {
      addOrUpdate: metaWidgets,
      deleteIds: removedMetaWidgetIds,
    };

    if (mainCanvasWidget) {
      metaWidgets[mainCanvasWidget.widgetId] = mainCanvasWidget;
    }

    const { metaWidgetId: metaMainCanvasId } =
      this.metaWidgetGenerator.getContainerParentCache() || {};
    if (
      this.props.isMetaWidget &&
      metaMainCanvasId !== this.props.children?.[0]?.widgetId
    ) {
      // Inner list widget's cloned row's main canvas widget
      // will have a new widgetId as it has to be different from the
      // main template  canvas widgetId. This new widgetId has to be
      // updated as the "children" of the inner List widget.
      updates.propertyUpdates = [
        {
          path: "children",
          value: [metaMainCanvasId],
        },
      ];
    }

    if (
      !isEmpty(updates.addOrUpdate) ||
      updates.deleteIds.length ||
      updates.propertyUpdates?.length
    ) {
      this.modifyMetaWidgets(updates);
    }
  };

  generateMainMetaCanvasWidget = () => {
    const {
      ids: currMetaContainerIds,
    } = this.metaWidgetGenerator.getMetaContainers();

    const mainCanvasWidget = this.mainMetaCanvasWidget();
    if (mainCanvasWidget) {
      mainCanvasWidget.children = currMetaContainerIds;
    }

    if (!equal(this.prevMetaMainCanvasWidget, mainCanvasWidget)) {
      this.prevMetaMainCanvasWidget = mainCanvasWidget;
      return mainCanvasWidget;
    }
  };

  updateCurrentViewItemsBinding = () => {
    const {
      names: currMetaContainerNames,
    } = this.metaWidgetGenerator.getMetaContainers();

    if (!equal(this.prevMetaContainerNames, currMetaContainerNames)) {
      const currentViewItemsBinding = `{{[${currMetaContainerNames.map(
        (name) => `${name}.data`,
      )}]}}`;

      // This doesn't trigger another evaluation
      this.context?.syncUpdateWidgetMetaProperty?.(
        this.props.widgetId,
        "currentViewItems",
        currentViewItemsBinding,
      );
    }
  };

  syncMetaContainerNames = () => {
    const {
      names: currMetaContainerNames,
    } = this.metaWidgetGenerator.getMetaContainers();
    this.prevMetaContainerNames = [...currMetaContainerNames];
  };

  getMainContainer = (
    passedFlattenedWidgets?: Record<string, FlattenedWidgetProps>,
  ) => {
    const {
      mainContainerId = "",
      flattenedChildCanvasWidgets = {},
    } = this.props;
    return (
      (passedFlattenedWidgets || flattenedChildCanvasWidgets)[
        mainContainerId
      ] || {}
    );
  };

  getTemplateBottomRow = () => {
    return this.getMainContainer()?.bottomRow;
  };

  hasTemplateBottomRowChanged = () => {
    const prevContainer = this.getMainContainer(
      this.prevFlattenedChildCanvasWidgets,
    );
    const currContainer = this.getMainContainer(
      this.props.flattenedChildCanvasWidgets,
    );

    return prevContainer?.bottomRow !== currContainer?.bottomRow;
  };

  getPageSize = () => {
    // TODO: FInd const for this
    const {
      infiniteScroll,
      listData,
      parentRowSpace,
      serverSidePaginationEnabled,
    } = this.props;
    const widgetPadding = parentRowSpace * 0.4;
    const itemsCount = (listData || []).length;

    if (infiniteScroll) {
      return itemsCount;
    }

    const gridGap = this.getGridGap();
    const templateBottomRow = this.getTemplateBottomRow();
    const { componentHeight } = this.getComponentDimensions();
    const templateHeight = templateBottomRow * parentRowSpace;

    const averageGridGap = itemsCount
      ? gridGap * ((itemsCount - 1) / itemsCount)
      : 0;

    const spaceAvailableWithoutPaginationControls =
      componentHeight - widgetPadding * 2;
    const spaceAvailableWithPaginationControls =
      spaceAvailableWithoutPaginationControls - LIST_WIDGET_PAGINATION_HEIGHT;

    const spaceTakenByOneContainer = templateHeight + averageGridGap;
    const spaceTakenByAllContainers = spaceTakenByOneContainer * itemsCount;
    const paginationControlsEnabled =
      spaceTakenByAllContainers > spaceAvailableWithoutPaginationControls ||
      serverSidePaginationEnabled;

    const totalAvailableSpace = paginationControlsEnabled
      ? spaceAvailableWithPaginationControls
      : spaceAvailableWithoutPaginationControls;

    const pageSize = totalAvailableSpace / spaceTakenByOneContainer;

    return isNaN(pageSize) ? 0 : floor(pageSize);
  };

  mainMetaCanvasWidget = () => {
    const { flattenedChildCanvasWidgets = {}, mainCanvasId = "" } = this.props;
    const mainCanvasWidget = flattenedChildCanvasWidgets[mainCanvasId] || {};
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    const metaMainCanvas = klona(mainCanvasWidget) ?? {};

    const { metaWidgetId, metaWidgetName } =
      this.metaWidgetGenerator.getContainerParentCache() || {};

    if (!metaWidgetId || !metaWidgetName) return;

    metaMainCanvas.parentId = this.props.widgetId;
    metaMainCanvas.widgetId = metaWidgetId;
    metaMainCanvas.widgetName = metaWidgetName;
    metaMainCanvas.canExtend = true;
    metaMainCanvas.isVisible = this.props.isVisible;
    metaMainCanvas.minHeight = componentHeight;
    metaMainCanvas.rightColumn = componentWidth;
    metaMainCanvas.noPad = true;
    metaMainCanvas.bottomRow = this.mainMetaCanvasWidgetBottomRow();

    return metaMainCanvas as MetaWidget;
  };

  mainMetaCanvasWidgetBottomRow = () => {
    const { componentHeight } = this.getComponentDimensions();
    const { shouldPaginate } = this.shouldPaginate();

    if (this.props.infiniteScroll) {
      return Math.max(
        this.metaWidgetGenerator.getVirtualListHeight() ?? 0,
        componentHeight,
      );
    } else {
      return shouldPaginate
        ? componentHeight - LIST_WIDGET_PAGINATION_HEIGHT
        : componentHeight;
    }
  };

  /**
   * generates the children entity definitions for children
   *
   * by entity definition we mean properties that will be open for users for autocomplete
   *
   * @param props
   */
  generateChildrenEntityDefinitions(props: ListWidgetProps) {
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

  getEntityDefinitionsFor = (widgetType: string) => {
    return Object.keys(
      omit(get(entityDefinitions, widgetType), ["!doc", "!url"]),
    );
  };

  // updates the "privateWidgets" field of the List Widget
  addPrivateWidgetsForChildren(props: ListWidgetProps) {
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
   * 400
   * 200
   * can data be paginated
   */
  shouldPaginate = () => {
    const {
      infiniteScroll = false,
      listData,
      serverSidePaginationEnabled,
    } = this.props;
    const pageSize = this.getPageSize();

    if (infiniteScroll) {
      return { shouldPaginate: false, pageSize: (listData || []).length };
    }

    if (serverSidePaginationEnabled) {
      return { shouldPaginate: true, pageSize: pageSize };
    }

    if (!listData?.length) {
      return { shouldPaginate: false, pageSize: 0 };
    }

    const shouldPaginate = pageSize < listData.length;

    return { shouldPaginate, pageSize: pageSize };
  };

  renderChildren = () => {
    const { componentWidth } = this.getComponentDimensions();
    return (this.props.metaWidgetChildrenStructure || []).map(
      (childWidgetStructure) => {
        const child: ExtendedCanvasWidgetStructure = {
          ...childWidgetStructure,
        };
        child.parentColumnSpace = this.props.parentColumnSpace;
        child.rightColumn = componentWidth;
        // child.shouldScrollContents = true;
        child.canExtend = true;

        return WidgetFactory.createWidget(child, this.props.renderMode);
      },
    );
  };

  onClientPageChange = (page: number) => this.setState({ page });

  overrideExecuteAction = (triggerPayload: ExecuteTriggerPayload) => {
    const { id: metaWidgetId } = triggerPayload?.source || {};

    if (metaWidgetId) {
      const { index } = this.metaWidgetGenerator.getCacheByMetaWidgetId(
        metaWidgetId,
      );
      const { listData = [] } = this.props;

      const globalContext = {
        currentIndex: index,
        currentItem: listData[index],
        ...triggerPayload.globalContext,
      };

      const payload = {
        ...triggerPayload,
        globalContext,
      };

      super.executeAction(payload);
    } else {
      log.error(
        `LIST_WIDGET_V2 ${this.props.widgetName} - meta widget not found on "executeAction" call`,
      );
    }
  };

  overrideBatchUpdateWidgetProperty = (
    metaWidgetId: string,
    updates: BatchPropertyUpdatePayload,
    shouldReplay: boolean,
  ) => {
    const {
      templateWidgetId,
    } = this.metaWidgetGenerator.getCacheByMetaWidgetId(metaWidgetId);
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.batchUpdateWidgetProperty?.(widgetId, updates, shouldReplay);
  };

  overrideUpdateWidget = (
    operation: WidgetOperation,
    metaWidgetId: string,
    payload: any,
  ) => {
    const {
      templateWidgetId,
    } = this.metaWidgetGenerator.getCacheByMetaWidgetId(metaWidgetId);
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.updateWidget?.(operation, widgetId, payload);
  };

  overrideUpdateWidgetProperty = (
    metaWidgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => {
    const {
      templateWidgetId,
    } = this.metaWidgetGenerator.getCacheByMetaWidgetId(metaWidgetId);
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.updateWidgetProperty?.(widgetId, propertyName, propertyValue);
  };

  overrideDeleteWidgetProperty = (
    metaWidgetId: string,
    propertyPaths: string[],
  ) => {
    const {
      templateWidgetId,
    } = this.metaWidgetGenerator.getCacheByMetaWidgetId(metaWidgetId);
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.deleteWidgetProperty?.(widgetId, propertyPaths);
  };

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const { componentHeight } = this.getComponentDimensions();
    const { pageNo, serverSidePaginationEnabled } = this.props;
    const { pageSize, shouldPaginate } = this.shouldPaginate();
    const templateHeight =
      this.getTemplateBottomRow() * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    if (this.props.isLoading) {
      return (
        <ListComponentLoading>
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
        backgroundColor={this.props.backgroundColor}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        componentRef={this.componentRef}
        height={componentHeight}
      >
        <MetaWidgetContextProvider
          batchUpdateWidgetProperty={this.overrideBatchUpdateWidgetProperty}
          deleteWidgetProperty={this.overrideDeleteWidgetProperty}
          executeAction={this.overrideExecuteAction}
          updateWidget={this.overrideUpdateWidget}
          updateWidgetProperty={this.overrideUpdateWidgetProperty}
        >
          {this.renderChildren()}
        </MetaWidgetContextProvider>
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
              pageSize={pageSize}
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

export interface ListWidgetProps<T extends WidgetProps = WidgetProps>
  extends WidgetProps {
  accentColor: string;
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  children?: T[];
  currentItemStructure?: Record<string, string>;
  dynamicPathMapList?: DynamicPathMapList;
  gridGap?: number;
  infiniteScroll?: boolean;
  level?: number;
  levelData?: LevelData;
  listData?: Array<Record<string, unknown>>;
  mainCanvasId?: string;
  mainContainerId?: string;
  onListItemClick?: string;
  primaryKey?: string | (string | number)[];
}

export default ListWidget;
