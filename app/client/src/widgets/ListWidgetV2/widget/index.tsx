import equal from "fast-deep-equal/es6";
import log from "loglevel";
import React, { createRef, RefObject } from "react";
import { get, isEmpty, floor } from "lodash";
import { klona } from "klona";

import BaseWidget, { WidgetOperation, WidgetProps } from "widgets/BaseWidget";
import derivedProperties from "./parseDerivedProperties";
import ListComponent, { ListComponentEmpty } from "../component";
import ListPagination, {
  ServerSideListPagination,
} from "../component/ListPagination";
import Loader from "../component/Loader";
import MetaWidgetContextProvider from "../../MetaWidgetContextProvider";
import MetaWidgetGenerator, { GeneratorOptions } from "../MetaWidgetGenerator";
import WidgetFactory from "utils/WidgetFactory";
import { BatchPropertyUpdatePayload } from "actions/controlActions";
import { CanvasWidgetStructure, FlattenedWidgetProps } from "widgets/constants";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { PrivateWidgets } from "entities/DataTree/dataTreeFactory";
import {
  PropertyPaneContentConfig,
  PropertyPaneStyleConfig,
} from "./propertyConfig";
import {
  RenderModes,
  WidgetType,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ModifyMetaWidgetPayload } from "reducers/entityReducers/metaWidgetsReducer";
import { WidgetState } from "../../BaseWidget";

const getCurrentViewRowsBindingTemplate = () => ({
  prefix: "{{[",
  suffix: "]}}",
});

const MINIMUM_ROW_GAP = -8;

export enum DynamicPathType {
  CURRENT_ITEM = "currentItem",
  CURRENT_INDEX = "currentIndex",
  CURRENT_ROW = "currentRow",
  LEVEL = "level",
}
export type DynamicPathMap = Record<string, DynamicPathType[]>;

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

type ExtendedCanvasWidgetStructure = CanvasWidgetStructure & {
  canExtend?: boolean;
  shouldScrollContents?: boolean;
};

const LIST_WIDGET_PAGINATION_HEIGHT = 36;

/* in the List Widget, "children.0.children.0.children.0.children" is the path to the list of all
  widgets present in the List Widget
*/
const PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET =
  "children.0.children.0.children.0.children";

class ListWidget extends BaseWidget<ListWidgetProps, WidgetState> {
  componentRef: RefObject<HTMLDivElement>;
  metaWidgetGenerator: MetaWidgetGenerator;
  prevFlattenedChildCanvasWidgets?: Record<string, FlattenedWidgetProps>;
  prevMetaContainerNames: string[];
  prevMetaMainCanvasWidget?: MetaWidget;
  pageSize: number;
  isDataLoading: boolean;

  static getPropertyPaneContentConfig() {
    return PropertyPaneContentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return PropertyPaneStyleConfig;
  }

  static getDerivedPropertiesMap() {
    return {
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
      currentViewRows: "{{[]}}",
      selectedRow: "{{{}}}",
      triggeredRow: "{{{}}}",
      selectedRowIndex: -1,
      triggeredRowIndex: -1,
    };
  }

  static getLoadingProperties(): Array<RegExp> | undefined {
    return [/\.listData$/];
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
      primaryWidgetType: ListWidget.getWidgetType(),
    });
    this.prevMetaContainerNames = [];
    this.componentRef = createRef<HTMLDivElement>();
    this.pageSize = this.getPageSize();
    this.isDataLoading = false;
  }

  componentDidMount() {
    this.pageSize = this.getPageSize();
    if (this.shouldUpdatePageSize()) {
      this.updatePageSize();
    }

    const generatorOptions = this.metaWidgetGeneratorOptions();
    // Mounts the virtualizer
    this.metaWidgetGenerator.withOptions(generatorOptions).didMount();

    if (this.props.infiniteScroll) {
      this.generateMetaWidgets();
    }

    // add privateWidgets to ListWidget
    this.addPrivateWidgetsForChildren(this.props);
    this.setupMetaWidgets();
  }

  componentDidUpdate(prevProps: ListWidgetProps) {
    this.prevFlattenedChildCanvasWidgets =
      prevProps.flattenedChildCanvasWidgets;

    this.pageSize = this.getPageSize();

    if (this.shouldUpdatePageSize()) {
      this.updatePageSize();
      if (this.shouldFireOnPageSizeChange()) {
        // run onPageSizeChange if user resize widgets
        this.triggerOnPageSizeChange();
      }
    }

    if (this.isCurrPageNoGreaterThanMaxPageNo()) {
      const maxPageNo = Math.ceil(
        (this.props?.listData?.length || 0) / this.pageSize,
      );

      this.onPageChange(maxPageNo);
    }

    if (this.props.primaryKeys !== prevProps.primaryKeys) {
      this.resetSelectedRowIndex();
      this.resetSelectedRow();
      this.resetTriggeredRowIndex();
      this.resetTriggeredRow();
    }

    if (this.hasListDataUpdated(prevProps.listData)) {
      this.resetIsDataLoading();
    }

    this.setupMetaWidgets(prevProps);
  }

  componentWillUnmount() {
    this.metaWidgetGenerator.didUnmount();
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
    const {
      flattenedChildCanvasWidgets = {},
      listData = [],
      mainCanvasId = "",
      mainContainerId = "",
      pageNo,
      primaryKeys,
      serverSidePagination = false,
    } = this.props;
    const pageSize = this.pageSize;

    const cacheRowIndexes = this.getCachedRowIndexes();

    return {
      cacheIndexArr: cacheRowIndexes,
      containerParentId: mainCanvasId,
      containerWidgetId: mainContainerId,
      currTemplateWidgets: flattenedChildCanvasWidgets,
      data: listData,
      gridGap: this.getGridGap(),
      infiniteScroll: this.props.infiniteScroll ?? false,
      levelData: this.props.levelData,
      prevTemplateWidgets: this.prevFlattenedChildCanvasWidgets,
      primaryKeys,
      scrollElement: this.componentRef.current,
      templateBottomRow: this.getTemplateBottomRow(),
      widgetName: this.props.widgetName,
      pageNo,
      pageSize,
      serverSidePagination,
    };
  };

  generateMetaWidgets = () => {
    const generatorOptions = this.metaWidgetGeneratorOptions();

    const {
      metaWidgets,
      removedMetaWidgetIds,
    } = this.metaWidgetGenerator.withOptions(generatorOptions).generate();

    this.updateCurrentViewRowsBinding();
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
      this.prevMetaMainCanvasWidget = klona(mainCanvasWidget);
      return mainCanvasWidget;
    }
  };

  updateCurrentViewRowsBinding = () => {
    const {
      names: currMetaContainerNames,
    } = this.metaWidgetGenerator.getMetaContainers();

    const { prefix, suffix } = getCurrentViewRowsBindingTemplate();

    if (!equal(this.prevMetaContainerNames, currMetaContainerNames)) {
      const currentViewRowsBinding = `${prefix}${currMetaContainerNames.map(
        (name) => `${name}.data`,
      )}${suffix}`;

      // This doesn't trigger another evaluation
      this.context?.syncUpdateWidgetMetaProperty?.(
        this.props.widgetId,
        "currentViewRows",
        currentViewRowsBinding,
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

  getContainerRowHeight = () => {
    const { listData, parentRowSpace } = this.props;
    const templateBottomRow = this.getTemplateBottomRow();
    const gridGap = this.getGridGap();

    const itemsCount = (listData || []).length;

    const templateHeight = templateBottomRow * parentRowSpace;

    const averageGridGap = itemsCount
      ? gridGap * ((itemsCount - 1) / itemsCount)
      : 0;
    return templateHeight + averageGridGap;
  };

  getPageSize = () => {
    // TODO: FInd const for this
    const { infiniteScroll, listData, serverSidePagination } = this.props;
    const spaceTakenByOneContainer = this.getContainerRowHeight();

    const itemsCount = (listData || []).length;

    const { componentHeight } = this.getComponentDimensions();

    const spaceAvailableWithoutPaginationControls =
      componentHeight - WIDGET_PADDING * 2;
    const spaceAvailableWithPaginationControls =
      spaceAvailableWithoutPaginationControls - LIST_WIDGET_PAGINATION_HEIGHT;

    const spaceTakenByAllContainers = spaceTakenByOneContainer * itemsCount;
    const paginationControlsEnabled =
      (spaceTakenByAllContainers > spaceAvailableWithoutPaginationControls ||
        serverSidePagination) &&
      !infiniteScroll;

    const totalAvailableSpace = paginationControlsEnabled
      ? spaceAvailableWithPaginationControls
      : spaceAvailableWithoutPaginationControls;

    const pageSize = totalAvailableSpace / spaceTakenByOneContainer;

    return isNaN(pageSize) ? 0 : floor(pageSize);
  };

  updatePageSize = () => {
    super.updateWidgetProperty("pageSize", this.pageSize);
  };

  shouldUpdatePageSize = () => {
    return this.props.pageSize !== this.pageSize;
  };

  shouldFireOnPageSizeChange = () => {
    return this.props.serverSidePagination && this.props.onPageSizeChange;
  };

  hasListDataUpdated = (prevListData: ListWidgetProps["listData"]) => {
    return this.isDataLoading && prevListData !== this.props.listData;
  };

  isCurrPageNoGreaterThanMaxPageNo = () => {
    if (
      this.props.listData &&
      !this.props.infiniteScroll &&
      !this.props.serverSidePagination
    ) {
      const maxPageNo = Math.ceil(this.props.listData?.length / this.pageSize);

      return maxPageNo < this.props.pageNo;
    }

    return false;
  };

  triggerOnPageSizeChange = () => {
    super.executeAction({
      triggerPropertyName: "onPageSizeChange",
      dynamicString: this.props.onPageSizeChange as string,
      event: {
        type: EventType.ON_PAGE_SIZE_CHANGE,
      },
    });
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
    metaMainCanvas.bottomRow =
      this.mainMetaCanvasWidgetBottomRow() - WIDGET_PADDING * 2;

    return metaMainCanvas as MetaWidget;
  };

  mainMetaCanvasWidgetBottomRow = () => {
    const { componentHeight } = this.getComponentDimensions();

    if (this.props.infiniteScroll) {
      return Math.max(
        this.metaWidgetGenerator.getVirtualListHeight() ?? 0,
        componentHeight,
      );
    } else {
      return this.shouldPaginate()
        ? componentHeight - LIST_WIDGET_PAGINATION_HEIGHT
        : componentHeight;
    }
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

    if (this.props.serverSidePagination) {
      this.setIsDataLoading();
    }

    const eventType =
      currentPage > page ? EventType.ON_PREV_PAGE : EventType.ON_NEXT_PAGE;

    if (this.props.serverSidePagination && this.props.onPageChange) {
      this.props.updateWidgetMetaProperty("pageNo", page, {
        triggerPropertyName: "onPageChange",
        dynamicString: this.props.onPageChange,
        event: {
          type: eventType,
        },
      });
    } else {
      this.props.updateWidgetMetaProperty("pageNo", page);
    }
  };

  onRowClick = (rowIndex: number) => {
    this.updateSelectedRowIndex(rowIndex);
    this.updateSelectedRow(rowIndex);

    if (!this.props.onRowClick) return;

    try {
      const rowData = this.props.listData?.[rowIndex];
      const { jsSnippets } = getDynamicBindings(this.props.onRowClick);
      const modifiedAction = jsSnippets.reduce((prev: string, next: string) => {
        return prev + `{{${next}}} `;
      }, "");

      const globalContext = {
        currentIndex: rowIndex,
        currentItem: rowData,
      };

      super.executeAction({
        dynamicString: modifiedAction,
        event: {
          type: EventType.ON_CLICK,
        },
        globalContext,
      });
    } catch (error) {
      log.debug("Error parsing row action", error);
    }
  };

  onRowClickCapture = (rowIndex: number) => {
    this.updateTriggeredRowIndex(rowIndex);
    this.updateTriggeredRow(rowIndex);
  };

  getCachedRowIndexes = () => {
    const cachedRowIndexes = new Set<number>();

    cachedRowIndexes.add(this.props.selectedRowIndex ?? -1);
    cachedRowIndexes.add(this.props.triggeredRowIndex ?? -1);

    return Array.from(cachedRowIndexes);
  };

  updateSelectedRowIndex = (rowIndex: number) => {
    const { selectedRowIndex } = this.props;

    if (rowIndex === selectedRowIndex) {
      this.resetSelectedRowIndex();
      return;
    }

    this.props.updateWidgetMetaProperty("selectedRowIndex", rowIndex);
  };

  updateSelectedRow = (rowIndex: number) => {
    const { selectedRowIndex } = this.props;

    if (rowIndex === selectedRowIndex) {
      this.resetSelectedRow();
      return;
    }

    const triggeredContainer = this.metaWidgetGenerator.getRowContainerWidgetName(
      rowIndex,
    );

    const selectedRowBinding = triggeredContainer
      ? `{{ ${triggeredContainer}.data }}`
      : "{{{}}}";

    this.context?.syncUpdateWidgetMetaProperty?.(
      this.props.widgetId,
      "selectedRow",
      selectedRowBinding,
    );
  };

  updateTriggeredRow = (rowIndex: number) => {
    const triggeredContainer = this.metaWidgetGenerator.getRowContainerWidgetName(
      rowIndex,
    );

    const triggeredRowBinding = triggeredContainer
      ? `{{ ${triggeredContainer}.data }}`
      : "{{{}}}";

    this.context?.syncUpdateWidgetMetaProperty?.(
      this.props.widgetId,
      "triggeredRow",
      triggeredRowBinding,
    );
  };

  resetSelectedRow = () => {
    this.context?.syncUpdateWidgetMetaProperty?.(
      this.props.widgetId,
      "selectedRow",
      "{{{}}}",
    );
  };

  resetTriggeredRow = () => {
    this.context?.syncUpdateWidgetMetaProperty?.(
      this.props.widgetId,
      "triggeredRow",
      "{{{}}}",
    );
  };

  setIsDataLoading = () => (this.isDataLoading = true);
  resetIsDataLoading = () => (this.isDataLoading = false);

  updateTriggeredRowIndex = (rowIndex: number) => {
    this.props.updateWidgetMetaProperty("triggeredRowIndex", rowIndex);
  };

  resetSelectedRowIndex = () => {
    this.props.updateWidgetMetaProperty("selectedRowIndex", -1);
  };

  resetTriggeredRowIndex = () => {
    this.props.updateWidgetMetaProperty("triggeredRowIndex", -1);
  };

  getGridGap = () =>
    this.props.gridGap && this.props.gridGap >= MINIMUM_ROW_GAP
      ? this.props.gridGap
      : 0;

  shouldPaginate = () => {
    /**
     * if client side pagination and not infinite scroll and data is more than page size
     * or
     * server side pagination enabled
     */
    return (
      (!this.props.serverSidePagination &&
        !this.props.infiniteScroll &&
        this.pageSize < (this.props.listData?.length || 0)) ||
      this.props.serverSidePagination
    );
  };

  getRowIndex = (viewIndex: number) => {
    const startIndex = this.metaWidgetGenerator.getStartIndex();
    return startIndex + viewIndex;
  };

  renderChildren = () => {
    const { componentWidth } = this.getComponentDimensions();
    const { selectedRowIndex } = this.props;

    return (this.props.metaWidgetChildrenStructure || []).map(
      (childWidgetStructure) => {
        const child: ExtendedCanvasWidgetStructure = {
          ...childWidgetStructure,
        };
        child.parentColumnSpace = this.props.parentColumnSpace;
        child.rightColumn = componentWidth;
        child.canExtend = true;
        child.children = child.children?.map((container, viewIndex) => {
          const rowIndex = this.getRowIndex(viewIndex);
          const focused =
            this.props.renderMode === RenderModes.CANVAS && rowIndex === 0;
          return {
            ...container,
            focused,
            selected: selectedRowIndex === rowIndex,
            onClick: (e: React.MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              this.onRowClick(rowIndex);
            },
            onClickCapture: () => {
              this.onRowClickCapture(rowIndex);
            },
          };
        });
        return WidgetFactory.createWidget(child, this.props.renderMode);
      },
    );
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

  getPageView() {
    const { componentHeight } = this.getComponentDimensions();
    const { pageNo, parentRowSpace, serverSidePagination } = this.props;
    const templateHeight = this.getTemplateBottomRow() * parentRowSpace;

    if (this.isDataLoading || this.props.isLoading) {
      return (
        <Loader
          gridGap={this.props.gridGap}
          pageSize={this.pageSize}
          templateHeight={templateHeight}
        />
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
          updateWidget={this.overrideUpdateWidget}
          updateWidgetProperty={this.overrideUpdateWidgetProperty}
        >
          {this.renderChildren()}
        </MetaWidgetContextProvider>
        {this.shouldPaginate() &&
          (serverSidePagination ? (
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
              disabled={false && this.props.renderMode === RenderModes.CANVAS}
              onChange={this.onPageChange}
              pageNo={this.props.pageNo}
              pageSize={this.pageSize}
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
  gridGap?: number;
  infiniteScroll?: boolean;
  level?: number;
  levelData?: LevelData;
  listData?: Array<Record<string, unknown>>;
  mainCanvasId?: string;
  mainContainerId?: string;
  onRowClick?: string;
  onPageSizeChange?: string;
  pageNo: number;
  pageSize: number;
  currentViewRows: string;
  selectedRowIndex?: number;
  selectedRow: Record<string, unknown>;
  triggeredRowIndex?: number;
  primaryKeys?: (string | number)[];
  serverSidePagination?: boolean;
}

export default ListWidget;
