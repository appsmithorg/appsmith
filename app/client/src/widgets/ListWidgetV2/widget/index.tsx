import equal from "fast-deep-equal/es6";
import log from "loglevel";
import memoize from "micro-memoize";
import React, { createRef, RefObject } from "react";
import { isEmpty, floor } from "lodash";
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

const getCurrentItemsViewBindingTemplate = () => ({
  prefix: "{{[",
  suffix: "]}}",
});

const MINIMUM_ROW_GAP = -8;
export const DEFAULT_TEMPLATE_BOTTOM_ROW = 10;

export enum DynamicPathType {
  CURRENT_ITEM = "currentItem",
  CURRENT_INDEX = "currentIndex",
  CURRENT_VIEW = "currentView",
  LEVEL = "level",
}
export type DynamicPathMap = Record<string, DynamicPathType[]>;

export type MetaWidgets = Record<string, MetaWidget>;

export type MetaWidget = FlattenedWidgetProps & {
  currentIndex: number;
  currentView: string;
  currentItem: string;
};

export type LevelData = {
  [level: string]: {
    currentIndex: number;
    currentItem: string;
    currentRowCache: MetaWidgetRowCache;
    autocomplete: Record<string, unknown>;
  };
};

export type MetaWidgetCacheProps = {
  entityDefinition: Record<string, string> | string;
  rowIndex: number;
  metaWidgetId: string;
  metaWidgetName: string;
  viewIndex: number;
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

type RenderChildrenOption = {
  componentWidth: number;
  parentColumnSpace: number;
  selectedItemIndex?: number;
};

const LIST_WIDGET_PAGINATION_HEIGHT = 36;

class ListWidget extends BaseWidget<
  ListWidgetProps,
  WidgetState,
  MetaWidgetCache
> {
  componentRef: RefObject<HTMLDivElement>;
  metaWidgetGenerator: MetaWidgetGenerator;
  prevFlattenedChildCanvasWidgets?: Record<string, FlattenedWidgetProps>;
  prevMetaContainerNames: string[];
  prevMetaMainCanvasWidget?: MetaWidget;
  pageSize: number;

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
      currentItemsView: "{{[]}}",
      selectedItemView: "{{{}}}",
      triggeredItemView: "{{{}}}",
      selectedItemIndex: -1,
      triggeredItemIndex: -1,
    };
  }

  constructor(props: ListWidgetProps | Readonly<ListWidgetProps>) {
    super(props);
    const { referencedWidgetId, widgetId } = props;
    const isListCloned =
      Boolean(referencedWidgetId) && referencedWidgetId !== widgetId;

    this.metaWidgetGenerator = new MetaWidgetGenerator({
      renderMode: props.renderMode,
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
      this.resetSelectedItemViewIndex();
      this.resetSelectedItemView();
      this.resetTriggeredItemViewIndex();
      this.resetTriggeredItemView();
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
          this.props.itemGap !== prevProps.itemGap ||
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
      itemGap: this.getItemGap(),
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

    this.updateCurrentItemsViewBinding();
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

  updateCurrentItemsViewBinding = () => {
    const {
      names: currMetaContainerNames,
    } = this.metaWidgetGenerator.getMetaContainers();

    const { prefix, suffix } = getCurrentItemsViewBindingTemplate();

    if (!equal(this.prevMetaContainerNames, currMetaContainerNames)) {
      const currentItemsViewBinding = `${prefix}${currMetaContainerNames.map(
        (name) => `${name}.data`,
      )}${suffix}`;

      // This doesn't trigger another evaluation
      this.context?.syncUpdateWidgetMetaProperty?.(
        this.props.widgetId,
        "currentItemsView",
        currentItemsViewBinding,
      );
    }
  };

  syncMetaContainerNames = () => {
    const {
      names: currMetaContainerNames,
    } = this.metaWidgetGenerator.getMetaContainers();
    this.prevMetaContainerNames = [...currMetaContainerNames];
  };

  getMainContainer = () => {
    const { flattenedChildCanvasWidgets, mainContainerId = "" } = this.props;
    return flattenedChildCanvasWidgets?.[mainContainerId];
  };

  getTemplateBottomRow = () => {
    return this.getMainContainer()?.bottomRow || DEFAULT_TEMPLATE_BOTTOM_ROW;
  };

  getContainerRowHeight = () => {
    const { listData, parentRowSpace } = this.props;
    const templateBottomRow = this.getTemplateBottomRow();
    const itemGap = this.getItemGap();

    const itemsCount = (listData || []).length;

    const templateHeight = templateBottomRow * parentRowSpace;

    const averageItemGap = itemsCount
      ? itemGap * ((itemsCount - 1) / itemsCount)
      : 0;
    return templateHeight + averageItemGap;
  };

  getPageSize = () => {
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

  onPageChange = (page: number) => {
    const currentPage = this.props.pageNo;

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
    this.updateSelectedItemViewIndex(rowIndex);
    this.updateSelectedItemView(rowIndex);

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
    this.updateTriggeredItemViewIndex(rowIndex);
    this.updateTriggeredItemView(rowIndex);
  };

  getCachedRowIndexes = () => {
    const cachedRowIndexes = new Set<number>();

    cachedRowIndexes.add(this.props.selectedItemIndex ?? -1);
    cachedRowIndexes.add(this.props.triggeredItemIndex ?? -1);

    return Array.from(cachedRowIndexes);
  };

  updateSelectedItemViewIndex = (rowIndex: number) => {
    const { selectedItemIndex } = this.props;

    if (rowIndex === selectedItemIndex) {
      this.resetSelectedItemViewIndex();
      return;
    }

    this.props.updateWidgetMetaProperty("selectedItemIndex", rowIndex);
  };

  updateSelectedItemView = (rowIndex: number) => {
    const { selectedItemIndex } = this.props;

    if (rowIndex === selectedItemIndex) {
      this.resetSelectedItemView();
      return;
    }

    const triggeredContainer = this.metaWidgetGenerator.getRowContainerWidgetName(
      rowIndex,
    );

    const selectedItemViewBinding = triggeredContainer
      ? `{{ ${triggeredContainer}.data }}`
      : "{{{}}}";

    this.context?.syncUpdateWidgetMetaProperty?.(
      this.props.widgetId,
      "selectedItemView",
      selectedItemViewBinding,
    );
  };

  updateTriggeredItemView = (rowIndex: number) => {
    const triggeredContainer = this.metaWidgetGenerator.getRowContainerWidgetName(
      rowIndex,
    );

    const triggeredItemViewBinding = triggeredContainer
      ? `{{ ${triggeredContainer}.data }}`
      : "{{{}}}";

    this.context?.syncUpdateWidgetMetaProperty?.(
      this.props.widgetId,
      "triggeredItemView",
      triggeredItemViewBinding,
    );
  };

  resetSelectedItemView = () => {
    this.context?.syncUpdateWidgetMetaProperty?.(
      this.props.widgetId,
      "selectedItemView",
      "{{{}}}",
    );
  };

  resetTriggeredItemView = () => {
    this.context?.syncUpdateWidgetMetaProperty?.(
      this.props.widgetId,
      "triggeredItemView",
      "{{{}}}",
    );
  };

  updateTriggeredItemViewIndex = (rowIndex: number) => {
    this.props.updateWidgetMetaProperty("triggeredItemIndex", rowIndex);
  };

  resetSelectedItemViewIndex = () => {
    this.props.updateWidgetMetaProperty("selectedItemIndex", -1);
  };

  resetTriggeredItemViewIndex = () => {
    this.props.updateWidgetMetaProperty("triggeredItemIndex", -1);
  };

  getItemGap = () =>
    this.props.itemGap && this.props.itemGap >= MINIMUM_ROW_GAP
      ? this.props.itemGap
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

  /**
   * Note: Do not use this.props inside the renderChildren method if the expectation is that
   * the renderChildren would re-render when the particular prop changes.
   * Instead pass that prop as part of options and make sure that an equality check if
   * added to the isMatchingKey method.
   */
  renderChildren = memoize(
    (
      metaWidgetChildrenStructure: ListWidgetProps["metaWidgetChildrenStructure"],
      options: RenderChildrenOption,
    ) => {
      const { componentWidth, parentColumnSpace, selectedItemIndex } = options;

      const childWidgets = (metaWidgetChildrenStructure || []).map(
        (childWidgetStructure) => {
          const child: ExtendedCanvasWidgetStructure = {
            ...childWidgetStructure,
          };
          child.parentColumnSpace = parentColumnSpace;
          child.rightColumn = componentWidth;
          child.canExtend = true;
          child.children = child.children?.map((container, viewIndex) => {
            const rowIndex = this.getRowIndex(viewIndex);
            const focused =
              this.props.renderMode === RenderModes.CANVAS && rowIndex === 0;
            return {
              ...container,
              focused,
              selected: selectedItemIndex === rowIndex,
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

      return childWidgets;
    },
    {
      isMatchingKey: (prevArgs, nextArgs) => {
        const prevMetaChildrenStructure = prevArgs[0];
        const nextMetaChildrenStructure = nextArgs[0];
        const prevOptions: RenderChildrenOption = prevArgs[1];
        const nextOptions: RenderChildrenOption = nextArgs[1];

        return (
          prevMetaChildrenStructure === nextMetaChildrenStructure &&
          prevOptions.componentWidth === nextOptions.componentWidth &&
          prevOptions.parentColumnSpace === nextOptions.parentColumnSpace &&
          prevOptions.selectedItemIndex === nextOptions.selectedItemIndex
        );
      },
    },
  );

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
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    const {
      pageNo,
      parentColumnSpace,
      parentRowSpace,
      selectedItemIndex,
      serverSidePagination,
    } = this.props;
    const templateHeight = this.getTemplateBottomRow() * parentRowSpace;

    if (this.props.isLoading) {
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
          {this.renderChildren(this.props.metaWidgetChildrenStructure, {
            componentWidth,
            parentColumnSpace,
            selectedItemIndex,
          })}
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
  itemGap?: number;
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
  currentItemsView: string;
  selectedItemIndex?: number;
  selectedItemView: Record<string, unknown>;
  triggeredItemIndex?: number;
  primaryKeys?: (string | number)[];
  serverSidePagination?: boolean;
}

export default ListWidget;
