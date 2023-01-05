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
import MetaWidgetGenerator, {
  GeneratorOptions,
  HookOptions,
} from "../MetaWidgetGenerator";
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
import { Stylesheet } from "entities/AppTheming";
import {
  TabContainerWidgetProps,
  TabsWidgetProps,
} from "widgets/TabsWidget/constants";

const getCurrentItemsViewBindingTemplate = () => ({
  prefix: "{{[",
  suffix: "]}}",
});

export const DEFAULT_TEMPLATE_BOTTOM_ROW = 10;

export enum DynamicPathType {
  CURRENT_ITEM = "currentItem",
  CURRENT_INDEX = "currentIndex",
  CURRENT_VIEW = "currentView",
  LEVEL = "level",
}
export type DynamicPathMap = Record<string, DynamicPathType[]>;

export type MetaWidgets = Record<string, MetaWidget>;

type BaseMetaWidget = FlattenedWidgetProps & {
  currentIndex: number;
  currentView: string;
  currentItem: Record<string, unknown> | string;
};

export type MetaWidget<TProps = void> = TProps extends void
  ? BaseMetaWidget
  : TProps & BaseMetaWidget;

export type LevelData = {
  [level: string]: {
    currentIndex: number;
    currentItem: string;
    currentRowCache: LevelDataRowCache;
    autocomplete: Record<string, unknown>;
  };
};

export type MetaWidgetCacheProps = {
  entityDefinition: Record<string, string> | string;
  metaWidgetId: string;
  metaWidgetName: string;
  originalMetaWidgetId: string;
  originalMetaWidgetName: string;
  prevRowIndex?: number;
  rowIndex: number;
  templateWidgetId: string;
  templateWidgetName: string;
  type: string;
  viewIndex: number;
};

export type RowDataCache = Record<string, Record<string, unknown>>;

type LevelDataMetaWidgetCacheProps = Omit<
  MetaWidgetCacheProps,
  "originalMetaWidgetId" | "originalMetaWidgetName"
>;

export type MetaWidgetRowCache = Record<string, MetaWidgetCacheProps>;

type LevelDataRowCache = Record<string, LevelDataMetaWidgetCacheProps>;

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
  selectedItemIndex: number;
  startIndex: number;
};

const LIST_WIDGET_PAGINATION_HEIGHT = 36;

class ListWidget extends BaseWidget<
  ListWidgetProps,
  WidgetState,
  MetaWidgetCache
> {
  cachedKeys: Record<string, number>;
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

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    };
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
      getWidgetCache: this.getWidgetCache,
      infiniteScroll: props.infiniteScroll ?? false,
      isListCloned,
      level: props.level || 1,
      onVirtualListScroll: this.generateMetaWidgets,
      prefixMetaWidgetId: props.prefixMetaWidgetId || props.widgetId,
      primaryWidgetType: ListWidget.getWidgetType(),
      renderMode: props.renderMode,
      setWidgetCache: this.setWidgetCache,
    });
    this.cachedKeys = {};
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
      if (this.props.serverSidePagination && !this.props.pageSize) {
        this.onPageChange(this.props.pageNo);
      }
    }

    if (this.props.serverSidePagination) {
      this.updateRowCacheWithNewData();
    }
    if (this.isCurrPageNoGreaterThanMaxPageNo()) {
      const maxPageNo = Math.max(
        Math.ceil((this.props?.listData?.length || 0) / this.pageSize),
        1,
      );

      this.onPageChange(maxPageNo);
    }

    if (this.shouldUpdateCacheKeys(prevProps)) {
      this.updateCacheKey();
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
          this.props.itemSpacing !== prevProps.itemSpacing ||
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

    return {
      containerParentId: mainCanvasId,
      containerWidgetId: mainContainerId,
      currTemplateWidgets: flattenedChildCanvasWidgets,
      data: listData,
      itemSpacing: this.props.itemSpacing || 0,
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
      hooks: {
        afterMetaWidgetGenerate: this.afterMetaWidgetGenerate,
      },
    };
  };

  generateMetaWidgets = () => {
    const generatorOptions = this.metaWidgetGeneratorOptions();
    this.handleRowCacheData();

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

  afterMetaWidgetGenerate = (metaWidget: MetaWidget, options: HookOptions) => {
    if (metaWidget.type === "TABS_WIDGET") {
      const tabsWidget = metaWidget as MetaWidget<
        TabsWidgetProps<TabContainerWidgetProps>
      >;
      const widgetIdToMetaWidgetIdMap: Record<string, string> = {};
      Object.values(options.childMetaWidgets).forEach(
        ({ referencedWidgetId = "", widgetId }) => {
          widgetIdToMetaWidgetIdMap[referencedWidgetId] = widgetId;
        },
      );

      Object.values(tabsWidget.tabsObj).forEach((tab) => {
        tab.widgetId = widgetIdToMetaWidgetIdMap[tab.widgetId];
      });
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
    const { itemSpacing = 0, listData, parentRowSpace } = this.props;
    const templateBottomRow = this.getTemplateBottomRow();

    const itemsCount = (listData || []).length;

    const templateHeight = templateBottomRow * parentRowSpace;

    const averageitemSpacing = itemsCount
      ? itemSpacing * ((itemsCount - 1) / itemsCount)
      : 0;
    return templateHeight + averageitemSpacing;
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

  getCurrDataCache = () => this.metaWidgetGenerator.getRowDataCache();

  setRowDataCache = () => {
    const prevDataCache = this.getCurrDataCache();
    const rowDataCache: RowDataCache = {};

    Object.entries(this.cachedKeys).forEach(([key, rowIndex]) => {
      if (Object.keys(prevDataCache).includes(key)) {
        rowDataCache[key] = prevDataCache[key];
        return;
      }
      const viewIndex = this.metaWidgetGenerator.getViewIndex(rowIndex);
      const rowData = this.props.listData?.[viewIndex] ?? {};
      rowDataCache[key] = rowData;
    });

    this.updateMetaGeneratorRowDataCache(rowDataCache);
    this.updateGeneratorCacheRowKeys(Object.keys(rowDataCache));
  };

  updateGeneratorCacheRowKeys = (keys: string[]) => {
    this.metaWidgetGenerator.updateCurrCachedRows(keys);
  };

  updateMetaGeneratorRowDataCache = (rowDataCache: RowDataCache) => {
    if (this.props.serverSidePagination) {
      this.metaWidgetGenerator.updateRowDataCache(rowDataCache);
    }
  };

  updateCacheKey = () => {
    const { selectedItemIndex = -1, triggeredItemIndex = -1 } = this.props;
    const cachedKeys: Record<string, number> = {};

    if (selectedItemIndex === -1 && triggeredItemIndex === -1) return;

    [selectedItemIndex, triggeredItemIndex].forEach((index) => {
      if (index === -1) return;

      if (Object.values(this.cachedKeys).includes(index)) {
        const key = Object.keys(this.cachedKeys).find(
          (key) => this.cachedKeys[key] === index,
        );
        if (key) cachedKeys[key] = index;
        return;
      }

      const key = this.metaWidgetGenerator.getPrimaryKey(index);
      cachedKeys[key] = index;
    });

    this.cachedKeys = cachedKeys;
  };

  shouldUpdateCacheKeys = (prevProps: ListWidgetProps) => {
    return (
      this.props.triggeredItemIndex !== prevProps.triggeredItemIndex ||
      this.props.selectedItemIndex !== prevProps.selectedItemIndex
    );
  };

  handleRowCacheData = () => {
    this.setRowDataCache();
  };

  updateRowCacheWithNewData = () => {
    let rowDataCache: RowDataCache = { ...this.getCurrDataCache() };
    Object.keys(this.cachedKeys).forEach((key) => {
      if (this.props.primaryKeys?.toString().includes(key)) {
        const rowIndex = this.cachedKeys[key];
        const startIndex = this.metaWidgetGenerator.getStartIndex();
        const viewIndex = rowIndex - startIndex;

        rowDataCache = {
          ...rowDataCache,
          [key]: this.props.listData?.[viewIndex] ?? rowDataCache[key],
        };
      }
    });
    this.updateMetaGeneratorRowDataCache(rowDataCache);
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
    this.setRowDataCache();
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

  updateTriggeredItemViewIndex = (rowIndex: number) => {
    this.props.updateWidgetMetaProperty("triggeredItemIndex", rowIndex);
  };

  resetSelectedItemViewIndex = () => {
    this.props.updateWidgetMetaProperty("selectedItemIndex", -1);
  };

  resetTriggeredItemViewIndex = () => {
    this.props.updateWidgetMetaProperty("triggeredItemIndex", -1);
  };

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
      const {
        componentWidth,
        parentColumnSpace,
        selectedItemIndex,
        startIndex,
      } = options;

      const childWidgets = (metaWidgetChildrenStructure || []).map(
        (childWidgetStructure) => {
          const child: ExtendedCanvasWidgetStructure = {
            ...childWidgetStructure,
          };
          child.parentColumnSpace = parentColumnSpace;
          child.rightColumn = componentWidth;
          child.canExtend = true;
          child.children = child.children?.map((container, viewIndex) => {
            const rowIndex = viewIndex + startIndex;
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
          prevOptions.selectedItemIndex === nextOptions.selectedItemIndex &&
          prevOptions.startIndex === nextOptions.startIndex
        );
      },
    },
  );

  overrideBatchUpdateWidgetProperty = (
    metaWidgetId: string,
    updates: BatchPropertyUpdatePayload,
    shouldReplay: boolean,
  ) => {
    const templateWidgetId = this.metaWidgetGenerator.getTemplateWidgetIdByMetaWidgetId(
      metaWidgetId,
    );
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.batchUpdateWidgetProperty?.(widgetId, updates, shouldReplay);
  };

  overrideUpdateWidget = (
    operation: WidgetOperation,
    metaWidgetId: string,
    payload: any,
  ) => {
    const templateWidgetId = this.metaWidgetGenerator.getTemplateWidgetIdByMetaWidgetId(
      metaWidgetId,
    );
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.updateWidget?.(operation, widgetId, payload);
  };

  overrideUpdateWidgetProperty = (
    metaWidgetId: string,
    propertyName: string,
    propertyValue: any,
  ) => {
    const templateWidgetId = this.metaWidgetGenerator.getTemplateWidgetIdByMetaWidgetId(
      metaWidgetId,
    );
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.updateWidgetProperty?.(widgetId, propertyName, propertyValue);
  };

  overrideDeleteWidgetProperty = (
    metaWidgetId: string,
    propertyPaths: string[],
  ) => {
    const templateWidgetId = this.metaWidgetGenerator.getTemplateWidgetIdByMetaWidgetId(
      metaWidgetId,
    );
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.deleteWidgetProperty?.(widgetId, propertyPaths);
  };

  shouldDisableNextPage = () => {
    const { listData, serverSidePagination } = this.props;

    return Boolean(serverSidePagination && !listData?.length);
  };

  renderPaginationUI = () => {
    const { isLoading, pageNo, serverSidePagination } = this.props;
    const disableNextPage = this.shouldDisableNextPage();
    return (
      this.shouldPaginate() &&
      (serverSidePagination ? (
        <ServerSideListPagination
          accentColor={this.props.accentColor}
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          disableNextPage={disableNextPage}
          disabled={false && this.props.renderMode === RenderModes.CANVAS}
          isLoading={isLoading}
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
          isLoading={isLoading}
          onChange={this.onPageChange}
          pageNo={this.props.pageNo}
          pageSize={this.pageSize}
          total={(this.props.listData || []).length}
        />
      ))
    );
  };

  getPageView() {
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    const {
      isLoading,
      parentColumnSpace,
      parentRowSpace,
      selectedItemIndex = -1,
    } = this.props;
    const startIndex = this.metaWidgetGenerator.getStartIndex();
    const templateHeight = this.getTemplateBottomRow() * parentRowSpace;

    if (isLoading) {
      return (
        <Loader
          itemSpacing={this.props.itemSpacing}
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
      return (
        <>
          <ListComponentEmpty>No data to display</ListComponentEmpty>
          {this.renderPaginationUI()}
        </>
      );
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
            startIndex,
          })}
        </MetaWidgetContextProvider>
        {this.renderPaginationUI()}
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
  itemSpacing?: number;
  infiniteScroll?: boolean;
  level?: number;
  levelData?: LevelData;
  listData?: Array<Record<string, unknown>>;
  mainCanvasId?: string;
  mainContainerId?: string;
  onRowClick?: string;
  pageNo: number;
  pageSize: number;
  prefixMetaWidgetId?: string;
  currentItemsView: string;
  selectedItemIndex?: number;
  selectedItemView: Record<string, unknown>;
  triggeredItemIndex?: number;
  primaryKeys?: (string | number)[];
  serverSidePagination?: boolean;
  rowDataCache: RowDataCache;
}

export default ListWidget;
