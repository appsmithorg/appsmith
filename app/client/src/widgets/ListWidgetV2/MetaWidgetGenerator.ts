import hash from "object-hash";
import { difference, omit, set, get, isEmpty, isString, isNil } from "lodash";
import type { VirtualizerOptions } from "@tanstack/virtual-core";
import type { RowDataChangeOptions, MetaWidgetRowCache, RowCache } from "./types";
import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  Virtualizer,
} from "@tanstack/virtual-core";
import isEqual from "fast-deep-equal/es6";

import Queue from "./Queue";
import { extractTillNestedListWidget } from "./widget/helper";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { generateReactKey } from "utils/generators";
import {
  GridDefaults,
  RenderModes,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import type {
  LevelData,
  ListWidgetProps,
  MetaWidget,
  MetaWidgetCache,
  MetaWidgetCacheProps,
  MetaWidgets,
} from "./widget";
import { DEFAULT_TEMPLATE_HEIGHT, DynamicPathType } from "./widget";
import type { WidgetProps } from "widgets/BaseWidget";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import WidgetFactory from "WidgetProvider/factory";
import { klonaRegularWithTelemetry } from "utils/helpers";

type TemplateWidgets =
  ListWidgetProps<WidgetProps>["flattenedChildCanvasWidgets"];

type CachedKeyDataMap = Record<string, Record<string, unknown>>;

type ReferenceCache = Record<
  string,
  | {
      siblings?: Set<string>;
      candidateWidgetId?: string;
    }
  | undefined
>;

interface UpdateSiblingsOptions {
  templateWidgetId: string;
  originalMetaWidgetId: string;
  metaWidget: MetaWidget;
}

interface GenerateDefaultCacheOptions {
  lookupId: string;
  templateWidget: FlattenedWidgetProps;
  generateEntityDefinition: boolean;
}

export interface HookOptions {
  childMetaWidgets: MetaWidgets;
  rowReferences: Record<string, string | undefined>;
}

type Hook = (metaWidget: MetaWidget, options: HookOptions) => void;

interface Hooks {
  afterMetaWidgetGenerate?: Hook;
}

export interface GeneratorOptions {
  containerParentId: string;
  containerWidgetId: string;
  currTemplateWidgets: TemplateWidgets;
  prevTemplateWidgets?: TemplateWidgets;
  data: Record<string, unknown>[];
  hooks?: Hooks;
  itemSpacing: number;
  infiniteScroll: ConstructorProps["infiniteScroll"];
  level?: number;
  levelData?: LevelData;
  nestedViewIndex?: number;
  pageNo?: number;
  pageSize?: number;
  primaryKeys?: string[];
  scrollElement: HTMLDivElement | null;
  serverSidePagination: boolean;
  templateHeight: number;
  widgetName: string;
}

export interface ConstructorProps {
  getWidgetCache: () => MetaWidgetCache | undefined;
  getWidgetReferenceCache: () => ReferenceCache | undefined;
  infiniteScroll: boolean;
  isListCloned: boolean;
  level: number;
  onVirtualListScroll: () => void;
  prefixMetaWidgetId: string;
  primaryWidgetType: string;
  renderMode: string;
  setWidgetCache: (data: MetaWidgetCache) => void;
  setWidgetReferenceCache: (data: ReferenceCache) => void;
}

interface TemplateWidgetStatus {
  added: Set<string>;
  updated: Set<string>;
  removed: Set<string>;
  unchanged: Set<string>;
}

interface CacheDataOption {
  keepMetaWidgetData: boolean;
  key: string;
}

interface GenerateMetaWidgetProps {
  rowIndex: number;
  templateWidgetId: string;
  parentId: string;
  options?: CacheDataOption;
}

interface GenerateMetaWidgetChildrenProps {
  rowIndex: number;
  parentId: string;
  templateWidget: FlattenedWidgetProps;
  options?: CacheDataOption;
}

interface GeneratedMetaWidget {
  metaWidgetId?: string;
  metaWidgetName?: string;
  childMetaWidgets?: MetaWidgets;
  metaWidget?: MetaWidget;
}

interface CachedRows {
  prev: Set<string>;
  curr: Set<string>;
}

interface LevelProperty {
  currentIndex: number;
  currentItem: string;
  currentView: Record<string, string>;
}

type VirtualizerInstance = Virtualizer<HTMLDivElement, HTMLDivElement>;
type VirtualizerOptionsProps = VirtualizerOptions<
  HTMLDivElement,
  HTMLDivElement
>;

interface AddDynamicPathsPropertiesOptions {
  excludedPaths?: string[];
}

interface ViewMetaWidget {
  metaWidgetId: string;
  isClonedItem: boolean;
  templateWidgetId: string;
}

type Siblings = Record<string, string[]>;

enum MODIFICATION_TYPE {
  LEVEL_DATA_UPDATED = "LEVEL_DATA_UPDATED",
  REGENERATE_META_WIDGETS = "REGENERATE_META_WIDGETS",
  UPDATE_CONTAINER = "UPDATE_CONTAINER",
  GENERATE_CACHE_WIDGETS = "GENERATE_CACHE_WIDGETS",
}

const ROOT_CONTAINER_PARENT_KEY = "__$ROOT_CONTAINER_PARENT$__";
const ROOT_ROW_KEY = "__$ROOT_KEY$__";
/**
 * When computing level_1.currentView.List2
 */
const BLACKLISTED_ENTITY_DEFINITION_IN_LEVEL_DATA: Record<
  string,
  string[] | undefined
> = {
  LIST_WIDGET_V2: ["selectedItemView", "triggeredItemView", "currentItemsView"],
};
/**
 * LEVEL_PATH_REGEX gives out following matches:
 * Inputs
 * {{() => { level_1.currentIndex+ level_22.currentView.something.test}()}}
 * {{level_1.currentIndex + level_1.currentView.something.test}}
 * {{Text1.value}}
 *
 * Outputs
 * ["level_1.currentIndex", level_22.currentView.something.test]
 * ["level_1.currentIndex", level_1.currentView.something.test]
 * null
 */
// eslint-disable-next-line prettier/prettier
const LEVEL_PATH_REGEX = /level_[\$\w]*(\.[a-zA-Z\$\_][\$\w]*)*/gi;

const hasCurrentItem = (value: string) =>
  isString(value) && value.indexOf("currentItem") > -1;
const hasCurrentIndex = (value: string) =>
  isString(value) && value.indexOf("currentIndex") > -1;
const hasCurrentView = (value: string) =>
  isString(value) && value.indexOf("currentView") > -1;
const hasLevel = (value: string) =>
  isString(value) && value.indexOf("level_") > -1;

export default class MetaWidgetGenerator {
  siblings: Siblings;
  rowDataCache: MetaWidgetRowCache = {};
  cachedItemKeys: CachedRows;
  containerParentId: GeneratorOptions["containerParentId"];
  private containerWidgetId: GeneratorOptions["containerWidgetId"];
  private currTemplateWidgets: TemplateWidgets;
  private currViewMetaWidgets: ViewMetaWidget[];
  private data: GeneratorOptions["data"];
  private getWidgetCache: ConstructorProps["getWidgetCache"];
  private getWidgetReferenceCache: ConstructorProps["getWidgetReferenceCache"];
  private hooks?: GeneratorOptions["hooks"];
  private itemSpacing: GeneratorOptions["itemSpacing"];
  private infiniteScroll: ConstructorProps["infiniteScroll"];
  private isListCloned: ConstructorProps["isListCloned"];
  private level: ConstructorProps["level"];
  private levelData: GeneratorOptions["levelData"];
  private metaIdToTemplateIdMap: Record<string, string>;
  private modificationsQueue: Queue<MODIFICATION_TYPE>;
  private nestedViewIndex?: GeneratorOptions["nestedViewIndex"];
  private onVirtualListScroll: ConstructorProps["onVirtualListScroll"];
  private pageNo?: number;
  private pageSize?: number;
  private prefixMetaWidgetId: string;
  private prevOptions?: GeneratorOptions;
  private prevTemplateWidgets: TemplateWidgets;
  private prevViewMetaWidgets: ViewMetaWidget[];
  private prevPrimaryKeys: string[];
  private primaryKeys: string[];
  private primaryWidgetType: ConstructorProps["primaryWidgetType"];
  private renderMode: ConstructorProps["renderMode"];
  private cachedKeyDataMap: CachedKeyDataMap;
  private scrollElement: GeneratorOptions["scrollElement"];
  private serverSidePagination: GeneratorOptions["serverSidePagination"];
  private setWidgetCache: ConstructorProps["setWidgetCache"];
  private setWidgetReferenceCache: ConstructorProps["setWidgetReferenceCache"];
  private templateHeight: GeneratorOptions["templateHeight"];
  private templateWidgetCandidates: Set<string>;
  private templateWidgetStatus: TemplateWidgetStatus;
  private virtualizer?: VirtualizerInstance;
  private widgetName: GeneratorOptions["widgetName"];

  constructor(props: ConstructorProps) {
    this.siblings = {};
    this.cachedItemKeys = {
      prev: new Set(),
      curr: new Set(),
    };
    this.containerParentId = "";
    this.containerWidgetId = "";
    this.currViewMetaWidgets = [];
    this.data = [];
    this.getWidgetCache = props.getWidgetCache;
    this.getWidgetReferenceCache = props.getWidgetReferenceCache;
    this.itemSpacing = 0;
    this.infiniteScroll = props.infiniteScroll;
    this.isListCloned = props.isListCloned;
    this.level = props.level;
    this.levelData = undefined;
    this.metaIdToTemplateIdMap = {};
    this.onVirtualListScroll = props.onVirtualListScroll;
    this.pageNo = 1;
    this.pageSize = 0;
    this.prefixMetaWidgetId = props.prefixMetaWidgetId;
    this.prevTemplateWidgets = {};
    this.prevViewMetaWidgets = [];
    this.prevPrimaryKeys = [];
    this.primaryKeys = [];
    this.primaryWidgetType = props.primaryWidgetType;
    this.serverSidePagination = false;
    this.renderMode = props.renderMode;
    this.cachedKeyDataMap = {};
    this.modificationsQueue = new Queue<MODIFICATION_TYPE>();
    this.scrollElement = null;
    this.setWidgetCache = props.setWidgetCache;
    this.setWidgetReferenceCache = props.setWidgetReferenceCache;
    this.templateHeight = DEFAULT_TEMPLATE_HEIGHT;
    this.templateWidgetCandidates = new Set();
    this.templateWidgetStatus = {
      added: new Set(),
      updated: new Set(),
      removed: new Set(),
      unchanged: new Set(),
    };
    this.widgetName = "";
  }

  withOptions = (options: GeneratorOptions) => {
    this.containerParentId = options.containerParentId;
    this.containerWidgetId = options.containerWidgetId;
    this.data = options.data;
    this.itemSpacing = options.itemSpacing;
    this.infiniteScroll = options.infiniteScroll;
    this.levelData = options.levelData;
    this.nestedViewIndex = options.nestedViewIndex;
    this.pageNo = options.pageNo;
    this.pageSize = options.pageSize;
    this.scrollElement = options.scrollElement;
    this.serverSidePagination = options.serverSidePagination;
    this.templateHeight = options.templateHeight;
    this.widgetName = options.widgetName;
    this.hooks = options.hooks;
    this.currTemplateWidgets = extractTillNestedListWidget(
      options.currTemplateWidgets,
      options.containerParentId,
    );
    this.prevTemplateWidgets = extractTillNestedListWidget(
      options.prevTemplateWidgets,
      options.containerParentId,
    );

    this.level = options.level ?? 1;
    this.prevPrimaryKeys = this.primaryKeys;
    this.primaryKeys = this.generatePrimaryKeys(options);

    this.updateModificationsQueue(this.prevOptions);

    // Update CacheKeyDataMap when Data changes but PrimaryKey doesn't Change for a Key in CurrentView
    if (this.shouldUpdateCachedKeyDataMap()) {
      this.updateCachedKeyDataMap(this.cachedItemKeys.curr);
    }

    // Maybe don't deep-clone for perf?
    const prevOptions = klonaRegularWithTelemetry(
      this.prevOptions,
      "MetaWidgetGenerator.withOptions",
    );

    this.prevOptions = options;

    this._didUpdate(options, prevOptions);

    return this;
  };

  private _didUpdate = (
    nextOptions: GeneratorOptions,
    prevOptions?: GeneratorOptions,
  ) => {
    if (!prevOptions?.infiniteScroll && nextOptions.infiniteScroll) {
      // Infinite scroll enabled
      this.initVirtualizer();
    } else if (prevOptions?.infiniteScroll && !nextOptions.infiniteScroll) {
      // Infinite scroll disabled
      this.unmountVirtualizer();
    }
  };

  didMount = () => {
    if (this.infiniteScroll) {
      this.initVirtualizer();
    }
  };

  didUnmount = () => {
    this.unmountVirtualizer();
  };

  generate = () => {
    const currentViewData = this.getCurrentViewData();
    const dataCount = currentViewData.length;
    const indices = Array.from(Array(dataCount).keys());
    const containerParentWidget =
      this?.currTemplateWidgets?.[this.containerParentId];
    let metaWidgets: MetaWidgets = {};

    this.siblings = {};

    if (
      this.modificationsQueue.has(MODIFICATION_TYPE.REGENERATE_META_WIDGETS)
    ) {
      // Reset
      this.currViewMetaWidgets = [];
      this.templateWidgetCandidates = new Set();

      this.generateWidgetCacheForContainerParent(containerParentWidget);
      this.updateTemplateWidgetStatus();

      if (dataCount > 0) {
        const startIndex = this.getStartIndex();

        indices.forEach((viewIndex) => {
          const rowIndex = startIndex + viewIndex;

          this.generateWidgetCacheData(rowIndex, viewIndex);

          const { childMetaWidgets, metaWidget } =
            this.generateMetaWidgetRecursively({
              rowIndex,
              parentId: this.containerParentId,
              templateWidgetId: this.containerWidgetId,
            });

          metaWidgets = {
            ...metaWidgets,
            ...childMetaWidgets,
          };

          if (metaWidget) {
            metaWidgets[metaWidget.widgetId] = metaWidget;
          }
        });
      }
    }

    const removedMetaWidgetIds = this.getRemovedMetaWidgetIds();

    if (this.modificationsQueue.has(MODIFICATION_TYPE.GENERATE_CACHE_WIDGETS)) {
      const cachedMetaWidgets = this.getCachedMetaWidgets();

      metaWidgets = { ...metaWidgets, ...cachedMetaWidgets };
      this.cachedItemKeys.prev = new Set(this.cachedItemKeys.curr);
    }

    this.prevViewMetaWidgets = [...this.currViewMetaWidgets];

    this.flushModificationQueue();

    return {
      metaWidgets,
      removedMetaWidgetIds,
      propertyUpdates: this.convertToPropertyUpdates(this.siblings),
    };
  };

  getCachedMetaWidgets = () => {
    let cachedMetaWidgets: MetaWidgets = {};

    this.cachedItemKeys.curr.forEach((key) => {
      const rowIndex = this.getRowIndexFromPrimaryKey(key);

      const { childMetaWidgets, metaWidget } =
        this.generateMetaWidgetRecursively({
          rowIndex,
          parentId: this.containerParentId,
          templateWidgetId: this.containerWidgetId,
          options: {
            keepMetaWidgetData: true,
            key,
          },
        });

      cachedMetaWidgets = {
        ...cachedMetaWidgets,
        ...childMetaWidgets,
      };

      if (metaWidget) {
        cachedMetaWidgets[metaWidget.widgetId] = metaWidget;
      }
    });

    return cachedMetaWidgets;
  };

  private generateMetaWidgetId = () =>
    `${this.prefixMetaWidgetId}_${generateReactKey()}`;

  private getMetaWidgetIdsInCachedItems = () => {
    const currCachedMetaWidgetIds: string[] = [];
    const prevCachedMetaWidgetIds: string[] = [];

    this.cachedItemKeys.prev.forEach((key) => {
      const metaCacheProps = this.getRowCache(key) ?? {};

      Object.values(metaCacheProps).forEach((cache) => {
        prevCachedMetaWidgetIds.push(cache.metaWidgetId);
      });
    });

    if (!this.cachedItemKeys.curr.size)
      return { currCachedMetaWidgetIds, prevCachedMetaWidgetIds };

    this.cachedItemKeys.curr.forEach((key) => {
      const metaCacheProps = this.getRowCache(key) ?? {};

      Object.values(metaCacheProps).forEach((cache) => {
        currCachedMetaWidgetIds.push(cache.metaWidgetId);
      });
    });

    return { currCachedMetaWidgetIds, prevCachedMetaWidgetIds };
  };

  private getViewMetaWidgetIds = (viewMetaWidgets: ViewMetaWidget[]) => {
    return viewMetaWidgets.map(
      ({ isClonedItem, metaWidgetId, templateWidgetId }) => {
        return isClonedItem ? metaWidgetId : templateWidgetId;
      },
    );
  };

  private getPrevViewMetaWidgetIds = () =>
    this.getViewMetaWidgetIds(this.prevViewMetaWidgets);

  private getCurrViewMetaWidgetIds = () =>
    this.getViewMetaWidgetIds(this.currViewMetaWidgets);

  /**
   * The removed widgets are
   * 1. The removed widgets from view i.e diff from previous View and Current View
   * 2. The previously cached rows that are not in the current view
   */

  private getRemovedMetaWidgetIds = () => {
    const { currCachedMetaWidgetIds, prevCachedMetaWidgetIds } =
      this.getMetaWidgetIdsInCachedItems();
    const currViewMetaWidgetIds = this.getCurrViewMetaWidgetIds();
    const prevViewMetaWidgetIds = this.getPrevViewMetaWidgetIds();

    const removedWidgetsFromView = new Set(
      difference(prevViewMetaWidgetIds, currViewMetaWidgetIds),
    );

    prevCachedMetaWidgetIds.forEach((widgetId) => {
      if (!currViewMetaWidgetIds.includes(widgetId))
        removedWidgetsFromView.add(widgetId);
    });

    currCachedMetaWidgetIds.forEach((widgetId) => {
      removedWidgetsFromView.delete(widgetId);
    });

    return Array.from(removedWidgetsFromView);
  };

  private hasRowDataChanged(key: string, widgetId: string): boolean {
    const currentData = this.getCurrentRowData(key);
    const cachedData = this.rowDataCache[key]?.data;
    
    // If we don't have cached data, consider it as changed
    if (!cachedData) {
      this.updateRowDataCache(key, currentData);
      return true;
    }

    // Compare the current data with cached data
    const hasChanged = !isEqual(currentData, cachedData);
    
    // Debug logging for row data changes
    console.debug(
      `[RowDataChange] Key: ${key}, Changed: ${hasChanged}`,
      { widgetId, currentData, cachedData }
    );
    
    if (hasChanged) {
      this.updateRowDataCache(key, currentData);
    }
    
    return hasChanged;
  }

  private getCurrentRowData(key: string): Record<string, unknown> | undefined {
    return this.cachedKeyDataMap[key] || undefined;
  }

  private updateRowDataCache(key: string, data?: Record<string, unknown>) {
    this.rowDataCache[key] = {
      data,
      lastUpdated: Date.now(),
    };
  }

  private generateMetaWidgetRecursively = ({
    options,
    parentId,
    rowIndex,
    templateWidgetId,
  }: GenerateMetaWidgetProps): GeneratedMetaWidget => {
    const templateWidget = this.currTemplateWidgets?.[templateWidgetId];

    if (!templateWidget)
      return { metaWidgetId: undefined, metaWidgetName: undefined };

    const key = options ? options.key : this.getPrimaryKey(rowIndex);
    const metaWidget = klonaRegularWithTelemetry(
      templateWidget,
      "MetaWidgetGenerator.generateMetaWidgetRecursively",
    ) as MetaWidget;

    const metaCacheProps = this.getRowTemplateCache(
      key,
      templateWidgetId,
      options,
    );

    if (!metaCacheProps) {
      return {
        childMetaWidgets: undefined,
        metaWidgetId: undefined,
        metaWidgetName: undefined,
      };
    }

    const { metaWidgetId, metaWidgetName, originalMetaWidgetId } =
      metaCacheProps || {};
    const isMainContainerWidget = templateWidgetId === this.containerWidgetId;
    const viewIndex = this.getViewIndex(rowIndex);
    const rowReferences = this.getRowReferences(key);
    const { children, metaWidgets: childMetaWidgets } =
      this.generateMetaWidgetChildren({
        rowIndex,
        templateWidget,
        parentId: metaWidgetId,
        options,
      });

    if (
      !this.shouldGenerateMetaWidgetFor(templateWidget.widgetId, key) &&
      !options?.keepMetaWidgetData &&
      !this.hasRowDataChanged(key, templateWidget.widgetId)
    ) {
      return { childMetaWidgets, metaWidgetName, metaWidgetId };
    }

    if (isMainContainerWidget) {
      this.updateContainerPosition(metaWidget, rowIndex);
      this.updateContainerBindings(metaWidget, key, options);
      this.addDynamicPathsProperties(metaWidget, metaCacheProps, key, {
        excludedPaths: ["data"],
      });
    } else {
      this.addDynamicPathsProperties(metaWidget, metaCacheProps, key);
    }

    metaWidget.currentIndex = this.serverSidePagination ? viewIndex : rowIndex;
    metaWidget.widgetId = metaWidgetId;
    metaWidget.widgetName = metaWidgetName;
    metaWidget.children = children;
    metaWidget.parentId = parentId;
    metaWidget.referencedWidgetId = templateWidgetId;
    metaWidget.metaWidgetId = originalMetaWidgetId;

    if (isMainContainerWidget) {
      this.disableResizeHandles(metaWidget);
    }

    if (templateWidget.type === this.primaryWidgetType) {
      this.addLevelData(metaWidget, rowIndex, key);
      metaWidget.prefixMetaWidgetId = this.prefixMetaWidgetId;
      /**
       * If nestedViewIndex is present then it comes from the outermost listwidget
       * and that value should ideally be continued to the nested list widgets.
       */
      metaWidget.nestedViewIndex = this.nestedViewIndex || viewIndex;
    }

    if (this.isRowNonConfigurable(metaCacheProps)) {
      this.disableWidgetOperations(metaWidget);
      metaWidget.suppressAutoComplete = true;
      metaWidget.suppressDebuggerError = true;
    }

    if (this.canHoldSiblingData(rowIndex)) {
      metaWidget.siblingMetaWidgets = this.getSiblings(templateWidgetId);
    }

    this.hooks?.afterMetaWidgetGenerate?.(metaWidget, {
      childMetaWidgets,
      rowReferences,
    });

    this.updateSiblings(rowIndex, {
      metaWidget,
      originalMetaWidgetId,
      templateWidgetId,
    });

    return {
      childMetaWidgets,
      metaWidget,
      metaWidgetId,
      metaWidgetName,
    };
  };

  private generateMetaWidgetChildren = ({
    options,
    parentId,
    rowIndex,
    templateWidget,
  }: GenerateMetaWidgetChildrenProps) => {
    const children: string[] = [];
    let metaWidgets: MetaWidgets = {};

    (templateWidget.children || []).forEach((childWidgetId: string) => {
      const { childMetaWidgets, metaWidget, metaWidgetId } =
        this.generateMetaWidgetRecursively({
          rowIndex,
          parentId,
          templateWidgetId: childWidgetId,
          options,
        });

      metaWidgets = {
        ...metaWidgets,
        ...childMetaWidgets,
      };

      if (metaWidgetId) {
        children.push(metaWidgetId);

        if (metaWidget) {
          metaWidgets[metaWidgetId] = metaWidget;
        }
      }
    });

    return {
      children,
      metaWidgets,
    };
  };

  private generateWidgetCacheData = (rowIndex: number, viewIndex: number) => {
    const key = this.getPrimaryKey(rowIndex);
    const rowCache = this.getRowCache(key) || {};
    const isClonedItem = this.isClonedItem(rowIndex);
    const templateWidgets = Object.values(this.currTemplateWidgets || {}) || [];
    const updatedRowCache: MetaWidgetCache[string] = {};

    templateWidgets.forEach((templateWidget) => {
      const { widgetId: templateWidgetId } = templateWidget;

      if (templateWidgetId === this.containerParentId) return;

      const defaultCache = this.generateDefaultCache(key, {
        lookupId: templateWidgetId,
        templateWidget,
        generateEntityDefinition: true,
      });

      const { metaWidgetId } = defaultCache;

      if (!isClonedItem) {
        this.templateWidgetCandidates.add(metaWidgetId);
      }

      this.currViewMetaWidgets.push({
        templateWidgetId,
        metaWidgetId,
        isClonedItem,
      });

      this.metaIdToTemplateIdMap[metaWidgetId] = templateWidgetId;

      updatedRowCache[templateWidgetId] = {
        ...defaultCache,
        rowIndex,
        viewIndex,
      };
    });

    this.setRowCache(key, {
      ...rowCache,
      ...updatedRowCache,
    });
  };

  private generateWidgetCacheForContainerParent = (
    templateWidget?: FlattenedWidgetProps,
  ) => {
    if (templateWidget) {
      const rowCache = this.getRowCache(ROOT_ROW_KEY) || {};
      const updatedRowCache: MetaWidgetCache[string] = {};

      const defaultCache = this.generateDefaultCache(ROOT_ROW_KEY, {
        lookupId: ROOT_CONTAINER_PARENT_KEY,
        templateWidget,
        generateEntityDefinition: false,
      });

      if (this.nestedViewIndex === undefined || this.nestedViewIndex === 0) {
        this.templateWidgetCandidates.add(defaultCache.metaWidgetId);
      }

      updatedRowCache[ROOT_CONTAINER_PARENT_KEY] = defaultCache;

      this.setRowCache(ROOT_ROW_KEY, {
        ...rowCache,
        ...updatedRowCache,
      });
    }
  };

  private generateDefaultCache = (
    key: string,
    options: GenerateDefaultCacheOptions,
  ) => {
    const { generateEntityDefinition, lookupId, templateWidget } = options;
    const rowCache = this.getRowCache(key) || {};
    const currentCache = rowCache[lookupId] || {};

    const {
      type,
      widgetId: templateWidgetId,
      widgetName: templateWidgetName,
    } = templateWidget;

    const metaWidgetId =
      currentCache.metaWidgetId || this.generateMetaWidgetId();

    const metaWidgetName =
      currentCache.metaWidgetName ||
      `${this.widgetName}_${templateWidgetName}_${metaWidgetId}`;
    const entityDefinition = generateEntityDefinition
      ? currentCache.entityDefinition ||
        this.getPropertiesOfWidget(metaWidgetName, type)
      : "";

    return {
      entityDefinition,
      metaWidgetId,
      metaWidgetName,
      originalMetaWidgetId: metaWidgetId,
      originalMetaWidgetName: metaWidgetName,
      prevRowIndex: currentCache.rowIndex,
      prevViewIndex: currentCache.viewIndex,
      rowIndex: -1,
      templateWidgetId,
      templateWidgetName,
      type,
      viewIndex: -1,
    };
  };

  private generatePrimaryKeys = (options: GeneratorOptions) => {
    const currentViewData = this.getSlicedByCurrentView(
      options.data,
    ) as GeneratorOptions["data"];
    const currentViewPrimaryKeys = this.getSlicedByCurrentView(
      options.primaryKeys || [],
    );

    return currentViewData.map((datum, index) => {
      const key = currentViewPrimaryKeys[index];

      if (typeof key === "number" || typeof key === "string") {
        return key.toString();
      }

      const datumToHash = datum ?? index;

      return hash(datumToHash, { algorithm: "md5" });
    });
  };

  private convertToPropertyUpdates = (siblings: Siblings) => {
    return Object.entries(siblings).map(([candidateWidgetId, siblings]) => ({
      path: `${candidateWidgetId}.siblingMetaWidgets`,
      value: siblings,
    }));
  };

  private disableWidgetOperations = (metaWidget: MetaWidget) => {
    set(metaWidget, "resizeDisabled", true);
    set(metaWidget, "disablePropertyPane", true);
    set(metaWidget, "dragDisabled", true);
    set(metaWidget, "dropDisabled", true);

    set(metaWidget, "ignoreCollision", true);
    set(metaWidget, "shouldScrollContents", undefined);

    this.disableResizeHandles(metaWidget);
  };

  private disableResizeHandles = (metaWidget: MetaWidget) => {
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

  /**
   *
   * levelData provides 2 information to the child list widget.
   * 1. parent list widget's currentView, currentItem and complete row's cache
   *  This helps child widget to fill in information where level_1 or level_2 property is used.
   * 2. provides auto-complete information.
   *  In the derived property of the List widget, the childAutoComplete property uses the currentItem and currentView
   *  to define the autocomplete suggestions.
   */
  private addLevelData = (
    metaWidget: MetaWidget,
    rowIndex: number,
    key: string,
  ) => {
    const { metaWidgetId, type, widgetId } = metaWidget;
    const currentViewData = this.getCurrentViewData();
    const shouldAddDataCacheToBinding = this.shouldAddDataCacheToBinding(
      metaWidgetId ?? widgetId,
      key,
    );
    const currentIndex = this.serverSidePagination
      ? this.getViewIndex(rowIndex)
      : rowIndex;
    const dataBinding = shouldAddDataCacheToBinding
      ? `{{${JSON.stringify(this.cachedKeyDataMap[key])}}}`
      : `{{${this.widgetName}.listData[${currentIndex}]}}`;
    const currentItem = dataBinding;
    const currentRowCache = this.getRowCacheGroupByTemplateWidgetName(key);
    const metaContainers = this.getMetaContainers();
    const metaContainerName = metaContainers.names[0];
    const blacklistedCacheKeys = [
      "originalMetaWidgetId",
      "originalMetaWidgetName",
      "prevRowIndex",
      "prevViewIndex",
    ];
    const rowCache = Object.entries(currentRowCache).reduce(
      (newRowCache, entry) => {
        const [metaWidgetName, cache] = entry;

        newRowCache[metaWidgetName] = omit(
          cache,
          blacklistedCacheKeys,
        ) as MetaWidgetCacheProps;

        return newRowCache;
      },
      {} as Record<string, MetaWidgetCacheProps | undefined>,
    );

    metaWidget.levelData = {
      ...this.levelData,
      [`level_${this.level}`]: {
        currentIndex,
        currentItem,
        currentRowCache: rowCache,
        autocomplete: {
          currentItem: currentViewData?.[0],
          // Uses any one of the row's container present on the List widget to
          // get the object of current row for autocomplete
          // traverse this data and create a new object filtering out the blacklisted properties
          currentView: `{{((data, blackListArr) => {
              const newObj = {};

              for (const key in data) {
                if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
                  newObj[key] = Object.fromEntries(
                    Object.entries(data[key]).filter(
                      ([nestedKey]) => !blackListArr.includes(nestedKey)
                    )
                  );
                }
              }
              return newObj;
              })(${metaContainerName}.data, ${JSON.stringify(
                BLACKLISTED_ENTITY_DEFINITION_IN_LEVEL_DATA[type],
              )} )
          }}`,
        },
      },
    };

    // We want autocomplete helper objects to be present only for Edit mode
    // as in View mode it's useless.
    if (this.renderMode !== RenderModes.PAGE) {
      const levels = Object.keys(metaWidget.levelData);

      levels.forEach((level) => {
        metaWidget.dynamicBindingPathList = [
          ...(metaWidget.dynamicBindingPathList || []),
          { key: `levelData.${level}.autocomplete.currentView` },
        ];
      });
    }

    metaWidget.level = this.level + 1;
  };

  updateWidgetNameInDynamicBinding = (
    binding: string,
    metaWidgetName: string,
    templateWidgetName: string,
  ) => {
    /*
     * There are certain edge cases where binding would be `undefined`
     * so assering type before performing replace operation
     */
    if (metaWidgetName === templateWidgetName || typeof binding !== "string") {
      return binding;
    }

    const pattern = new RegExp(`${templateWidgetName}\\.`, "g");

    return binding.replace(pattern, `${metaWidgetName}.`);
  };

  private addDynamicPathsProperties = (
    metaWidget: MetaWidget,
    metaWidgetCacheProps: MetaWidgetCacheProps,
    key: string,
    options: AddDynamicPathsPropertiesOptions = {},
  ) => {
    const { metaWidgetId, metaWidgetName, templateWidgetName } =
      metaWidgetCacheProps;
    const { excludedPaths = [] } = options;
    const dynamicPaths = this.getDynamicPaths(metaWidget);
    let referencesEntityDef: Record<string, string> = {};
    const pathTypes = new Set();

    if (!dynamicPaths.length) return;

    dynamicPaths.forEach(({ isTriggerPath, key: path }) => {
      if (excludedPaths.includes(path)) return;

      let propertyValue = get(metaWidget, path);

      propertyValue = this.updateWidgetNameInDynamicBinding(
        propertyValue,
        metaWidgetName,
        templateWidgetName,
      );
      const { jsSnippets, stringSegments } = getDynamicBindings(propertyValue);
      const js = combineDynamicBindings(jsSnippets, stringSegments);

      if (hasCurrentItem(propertyValue)) {
        this.addCurrentItemProperty(
          metaWidget,
          metaWidgetName,
          metaWidgetId,
          key,
        );
        pathTypes.add(DynamicPathType.CURRENT_ITEM);
      }

      if (hasCurrentIndex(propertyValue)) {
        pathTypes.add(DynamicPathType.CURRENT_INDEX);
      }

      if (hasCurrentView(propertyValue)) {
        referencesEntityDef = {
          ...referencesEntityDef,
          ...this.getReferencesEntityDefMap(propertyValue, key),
        };
        pathTypes.add(DynamicPathType.CURRENT_VIEW);
      }

      if (hasLevel(propertyValue)) {
        pathTypes.add(DynamicPathType.CURRENT_VIEW);
        const levelPaths = propertyValue.match(LEVEL_PATH_REGEX);

        if (levelPaths) {
          this.addLevelProperty(metaWidget, levelPaths);

          levelPaths.forEach((levelPath: string) => {
            const [level] = levelPath.split(".");

            pathTypes.add(level);
          });
        }
      }

      if (pathTypes.size) {
        const prefix = [...pathTypes].join(", ");
        const suffix = [...pathTypes]
          .map((type) => `${metaWidgetName}.${type}`)
          .join(", ");
        const bindingPrefix = `{{((${prefix}) =>`;
        const bindingSuffix = `)(${suffix})}}`;
        /**
         * For trigger paths the `js` binding is enclosed with `{ }`
         * where as the binding paths do not have `{}` as enclosed.
         *
         * Example
         * (() => { showAlert("Hello") })() // For trigger paths
         * (() => currentItem.name )() // For binding paths
         *
         * It is expected for binding paths to return a value from the binding so to make it
         *  return by default js binding cannot be wrapped around `{ }`.
         * But in case of trigger paths, it is not expected for the js binding to return anything
         *  but only execute other actions. When wrapped around `{ }`, it gives an advantage when
         *  action selectors are used to define a trigger/event. Action selectors by default adds a
         *  semi-colon(;) at the end of every action. If the wrapper `{}` is not present then a binding
         *  (() => showAlert("Hello"); )()
         *  would throw an error as the addition of a semi-colon is an invalid JavaScript syntax.
         *  Hence we convert the above IIFE to (() => { showAlert("Hello"); } )() to make the semi-colon work.
         */
        const propertyBinding = isTriggerPath
          ? `${bindingPrefix} { ${js} } ${bindingSuffix}`
          : `${bindingPrefix} ${js} ${bindingSuffix}`;

        set(metaWidget, path, propertyBinding);
      }
    });

    /**
     * Calling this here as all references in all the dynamicBindingPathList has to
     * be collected first in the above loop and then added at last.
     */
    if (pathTypes.has(DynamicPathType.CURRENT_VIEW)) {
      this.addCurrentViewProperty(
        metaWidget,
        Object.values(referencesEntityDef),
      );
    }
  };

  /**
   * Only include CacheItemDataMap in currentItem when
   * 1. Server-side Pagination (No need to cache data in client side)
   * 2. Its key is included in cachedRows
   * 3. It's not a Template widget. (A duplicate row is generated for template widget using their
   * original MetaWidgetId)
   */
  private shouldAddDataCacheToBinding = (widgetId: string, key: string) => {
    return (
      this.serverSidePagination &&
      this.cachedItemKeys.curr.has(key) &&
      !Object.keys(this.currTemplateWidgets ?? {}).includes(widgetId)
    );
  };

  private addCurrentItemProperty = (
    metaWidget: MetaWidget,
    metaWidgetName: string,
    metaWidgetId: string,
    key: string,
  ) => {
    if (metaWidget.currentItem) return;

    const shouldAddDataCacheToBinding = this.shouldAddDataCacheToBinding(
      metaWidgetId,
      key,
    );

    const dataBinding = shouldAddDataCacheToBinding
      ? `{{${JSON.stringify(this.cachedKeyDataMap[key])}}}`
      : `{{${this.widgetName}.listData[${metaWidgetName}.currentIndex]}}`;

    metaWidget.currentItem = dataBinding;
    metaWidget.dynamicBindingPathList = [
      ...(metaWidget.dynamicBindingPathList || []),
      { key: "currentItem" },
    ];
  };

  /**
   * This method adds a currentView property to the meta widget.
   * The currentView property has the corresponding row's widget's properties
   * based on the entity definition of that widget.
   * The way it is decided as to which meta widget's properties go in depends on the
   * widgets being referenced in the property value using the currentView
   *
   * Ex - {{currentView.Input1.value + currentView.Input2.value}}
   * In this case Input1's properties and Input2's properties are part of currentView
   *
   * The currentView in this case can look like (2nd row of list)
   * currentView = "{{
   *  Input1: {
   *    value: List1_Input1_1.value,
   *    text: List1_Input1_1.text
   *  },
   * Input2: {
   *    value: List1_Input2_1.value,
   *    text: List1_Input2_1.text
   *  }
   * List12.rowDataCache[543_123]
   * }}"
   *
   */
  private addCurrentViewProperty = (
    metaWidget: MetaWidget,
    references: string[],
  ) => {
    const currentViewBinding = Object.values(references).join(",");

    metaWidget.currentView = `{{{${currentViewBinding}}}}`;
    metaWidget.dynamicBindingPathList = [
      ...(metaWidget.dynamicBindingPathList || []),
      { key: "currentView" },
    ];
  };

  private addLevelProperty = (metaWidget: MetaWidget, levelPaths: string[]) => {
    if (!this.levelData) return;

    const levelProps: Record<string, Partial<LevelProperty>> = {};
    const dynamicBindingPathList: string[] = [];

    levelPaths.forEach((levelPath) => {
      const [level, dynamicPathType, widgetName] = levelPath.split(".");
      const lookupLevel = this.levelData?.[level];

      if (!lookupLevel) return;

      if (dynamicPathType === DynamicPathType.CURRENT_INDEX) {
        levelProps[level] = {
          ...(levelProps[level] || {}),
          currentIndex: lookupLevel.currentIndex,
        };
      }

      if (dynamicPathType === DynamicPathType.CURRENT_ITEM) {
        levelProps[level] = {
          ...(levelProps[level] || {}),
          currentItem: lookupLevel.currentItem,
        };

        dynamicBindingPathList.push(`${level}.currentItem`);
      }

      if (dynamicPathType === DynamicPathType.CURRENT_VIEW) {
        const { entityDefinition, metaWidgetName, type } =
          lookupLevel?.currentRowCache?.[widgetName] || {};

        if (entityDefinition) {
          let filteredEntityDefinition = entityDefinition;

          if (BLACKLISTED_ENTITY_DEFINITION_IN_LEVEL_DATA[type]) {
            filteredEntityDefinition = this.getPropertiesOfWidget(
              metaWidgetName,
              type,
              BLACKLISTED_ENTITY_DEFINITION_IN_LEVEL_DATA[type],
            );
          }

          levelProps[level] = {
            ...(levelProps[level] || {}),
            currentView: {
              ...(levelProps[level]?.currentView || {}),
              [widgetName]: `{{{${filteredEntityDefinition}}}}`,
            },
          };

          dynamicBindingPathList.push(`${level}.currentView.${widgetName}`);
        }
      }
    });

    Object.entries(levelProps).forEach(([level, props]) => {
      metaWidget[level] = props;
    });

    dynamicBindingPathList.forEach((path) => {
      metaWidget.dynamicBindingPathList = [
        ...(metaWidget.dynamicBindingPathList || []),
        { key: path },
      ];
    });
  };

  private updateContainerBindings = (
    metaWidget: MetaWidget,
    key: string,
    options = {
      keepMetaWidgetData: false,
    },
  ) => {
    const currentRowMetaWidgets = this.getCurrentRowMetaWidgets(key, options);
    const dataBinding = this.getContainerBinding(currentRowMetaWidgets);

    metaWidget.data = `{{${dataBinding}}}`;
    metaWidget.dynamicBindingPathList = [
      ...(metaWidget.dynamicBindingPathList || []),
      { key: "data" },
    ];
  };

  private updateContainerPosition = (
    metaWidget: MetaWidget,
    rowIndex: number,
  ) => {
    const viewIndex = this.getViewIndex(rowIndex);
    const mainContainer = this.getContainerWidget();
    const virtualItems = this.virtualizer?.getVirtualItems() || [];
    const virtualItem = virtualItems[viewIndex];
    const index = virtualItem ? virtualItem.index : viewIndex;

    const start = index * mainContainer.bottomRow;
    const end = (index + 1) * mainContainer.bottomRow;

    if (this.infiniteScroll) {
      metaWidget.rightColumn -= 1;
    }

    const verticalPadding = WIDGET_PADDING * 2;
    const verticalSpacing =
      (this.itemSpacing - verticalPadding) /
      GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    metaWidget.topRow = start + index * verticalSpacing;
    metaWidget.bottomRow = end + index * verticalSpacing;
  };

  /**
   * Compares the previous templateWidgets with the current and
   * populates this.templateWidgetStatus into 4 categories
   * added - new widgets dropped into the List widget
   * removed - widget removed from the List widget
   * unchanged - existing widgets that do not have any property change
   * updated - existing widgets that updated
   *
   *  */
  private updateTemplateWidgetStatus = () => {
    const newWidgetIds = Object.keys(this.currTemplateWidgets || {});
    const prevWidgetIds = Object.keys(this.prevTemplateWidgets || {});

    this.resetTemplateWidgetStatuses();

    const addedIds = difference(newWidgetIds, prevWidgetIds);
    const removedIds = difference(prevWidgetIds, newWidgetIds);
    const updatedIds = difference(newWidgetIds, addedIds);

    addedIds.forEach((addedId) => this.templateWidgetStatus.added.add(addedId));

    removedIds.forEach((removedId) =>
      this.templateWidgetStatus.removed.add(removedId),
    );

    updatedIds.forEach((updatedId) => {
      const isEqual =
        this.prevTemplateWidgets?.[updatedId] ===
        this.currTemplateWidgets?.[updatedId];

      if (isEqual) {
        this.templateWidgetStatus.unchanged.add(updatedId);
      } else {
        this.templateWidgetStatus.updated.add(updatedId);
      }
    });
  };

  private updateModificationsQueue = (prevOptions?: GeneratorOptions) => {
    if (
      this.itemSpacing !== prevOptions?.itemSpacing ||
      this.infiniteScroll != prevOptions?.infiniteScroll
    ) {
      this.modificationsQueue.add(MODIFICATION_TYPE.UPDATE_CONTAINER);
    }

    if (this.hasRegenerationOptionsChanged(prevOptions)) {
      this.modificationsQueue.add(MODIFICATION_TYPE.REGENERATE_META_WIDGETS);
    }

    if (this.levelData !== prevOptions?.levelData) {
      this.modificationsQueue.add(MODIFICATION_TYPE.LEVEL_DATA_UPDATED);
    }

    if (this.shouldGenerateCacheWidgets()) {
      this.modificationsQueue.add(MODIFICATION_TYPE.GENERATE_CACHE_WIDGETS);
    }
  };

  /**
   * Only generate cache widget when template widget property changes
   * or new template widgets are added
   * or new cached row is added.
   *
   */
  private shouldGenerateCacheWidgets = () => {
    return (
      (!isEqual(this.currTemplateWidgets, this.prevTemplateWidgets) &&
        this.renderMode !== RenderModes.PAGE) ||
      !isEqual(this.cachedItemKeys.curr, this.cachedItemKeys.prev) ||
      this.shouldUpdateCachedKeyDataMap()
    );
  };

  private getDynamicPaths = (metaWidget: MetaWidget) => {
    const dynamicPaths: (DynamicPath & { isTriggerPath: boolean })[] = [];

    (metaWidget.dynamicBindingPathList || []).forEach((path) => {
      dynamicPaths.push({ ...path, isTriggerPath: false });
    });

    (metaWidget.dynamicTriggerPathList || []).forEach((path) => {
      dynamicPaths.push({ ...path, isTriggerPath: true });
    });

    return dynamicPaths;
  };

  /**
   * rowIndex is used to get the state of the row(isClonedItem)
   * The rowIndex changes in live data so we need to
   * 1. if Key is in primaryKeys i.e the row is in currentView, we use rowIndex
   * 2. if key isn't in primaryKeys i.e it's a cachedRow and we're in a diff page, we use prevRowIndex
   */
  private getRowIndexFromPrimaryKey = (key: string) => {
    const rowCache = this.getRowCache(key) ?? {};
    const rowIndex = this.primaryKeys?.includes(key)
      ? rowCache[this.containerWidgetId]?.rowIndex
      : rowCache[this.containerWidgetId]?.prevRowIndex ??
        rowCache[this.containerWidgetId]?.rowIndex;

    return rowIndex;
  };

  private flushModificationQueue = () => {
    this.modificationsQueue.flush();
  };

  private resetTemplateWidgetStatuses = () => {
    Object.values(this.templateWidgetStatus).forEach((status) => {
      status.clear();
    });
  };

  recalculateVirtualList = (shouldRemeasureCb: () => boolean) => {
    if (shouldRemeasureCb()) {
      if (this.virtualizer) {
        this.remeasureVirtualizer();
      } else {
        this.initVirtualizer();
      }
    }
  };

  private isClonedItem = (rowIndex: number) => {
    const viewIndex = this.getViewIndex(rowIndex);

    return (
      this.renderMode === RenderModes.PAGE ||
      (this.renderMode === RenderModes.CANVAS && viewIndex !== 0) ||
      this.isListCloned
    );
  };

  private isRowNonConfigurable = ({
    metaWidgetId,
    templateWidgetId,
  }: MetaWidgetCacheProps) => {
    return (
      templateWidgetId !== metaWidgetId &&
      this.renderMode === RenderModes.CANVAS
    );
  };

  private shouldGenerateMetaWidgetFor = (
    templateWidgetId: string,
    key: string,
  ) => {
    const { originalMetaWidgetId, prevViewIndex, type, viewIndex } =
      this.getRowTemplateCache(key, templateWidgetId) || {};
    const { added, removed, unchanged } = this.templateWidgetStatus;
    const templateWidgetsAddedOrRemoved = added.size > 0 || removed.size > 0;
    const isMainContainerWidget = templateWidgetId === this.containerWidgetId;
    const isMetaWidgetPresentInCurrentView =
      this.isMetaWidgetPresentInView(originalMetaWidgetId);
    const hasTemplateWidgetChanged = !unchanged.has(templateWidgetId);
    const containerUpdateRequired = this.modificationsQueue.has(
      MODIFICATION_TYPE.UPDATE_CONTAINER,
    );
    const levelDataUpdated = this.modificationsQueue.has(
      MODIFICATION_TYPE.LEVEL_DATA_UPDATED,
    );
    const shouldMainContainerUpdate =
      templateWidgetsAddedOrRemoved || containerUpdateRequired;

    /**
     * true only when
     * if main container widget and any new children got added/removed then update
     * or
     * doesn't exist in current view
     * or
     * if non container widget's property modified
     * or
     * if nested primary widget type (list widget) and templateWidgetsAddedOrRemoved
     * is true (levelData should be updated in this case).
     * or
     * if nested primary widget type (list widget) and levelData updated.
     * or
     * the position of the item shuffled
     */
    return (
      (isMainContainerWidget && shouldMainContainerUpdate) ||
      !isMetaWidgetPresentInCurrentView ||
      hasTemplateWidgetChanged ||
      (type === this.primaryWidgetType && templateWidgetsAddedOrRemoved) ||
      levelDataUpdated ||
      viewIndex !== prevViewIndex
    );
  };

  private hasRegenerationOptionsChanged = (prevOptions?: GeneratorOptions) => {
    return (
      prevOptions?.containerParentId !== this.containerParentId ||
      prevOptions?.containerWidgetId !== this.containerWidgetId ||
      prevOptions?.widgetName !== this.widgetName ||
      prevOptions?.level !== this.level ||
      prevOptions?.levelData !== this.levelData ||
      prevOptions?.infiniteScroll !== this.infiniteScroll ||
      prevOptions?.itemSpacing !== this.itemSpacing ||
      prevOptions?.serverSidePagination !== this.serverSidePagination ||
      prevOptions?.templateHeight !== this.templateHeight ||
      !isEqual(this.currTemplateWidgets, this.prevTemplateWidgets) ||
      !isEqual(this.prevPrimaryKeys, this.primaryKeys)
    );
  };

  private isMetaWidgetPresentInView = (metaWidgetId?: string) => {
    return this.prevViewMetaWidgets.some((prevMetaWidget) => {
      return prevMetaWidget.metaWidgetId === metaWidgetId;
    });
  };

  private canHoldSiblingData = (rowIndex: number) => {
    const viewIndex = this.getViewIndex(rowIndex);

    /**
     * If nestedViewIndex is undefined then the list widget is the parent widget
     * and the 0th item can hold the data
     * or
     * If nestedViewIndex is present then it is a child list widget and the
     * value 0 would represent it is the first list widget and it's 0th item can hold the dat
     */
    return (
      (!this.nestedViewIndex || this.nestedViewIndex === 0) && viewIndex === 0
    );
  };

  private setRowCache = (key: string, rowData: MetaWidgetCache[string]) => {
    const cache = this.getWidgetCache() || {};
    const updatedCache = {
      ...cache,
      [key]: rowData,
    };

    this.setCache(updatedCache);
  };

  private updateSiblings = (
    rowIndex: number,
    options: UpdateSiblingsOptions,
  ) => {
    const { metaWidget, originalMetaWidgetId, templateWidgetId } = options;
    const viewIndex = this.getViewIndex(rowIndex);
    const referenceCache = klonaRegularWithTelemetry(
      this.getWidgetReferenceCache(),
      "MetaWidgetGenerator.updateSiblings.getWidgetReferenceCache",
    );

    const currentCache = referenceCache?.[templateWidgetId];
    const siblings = klonaRegularWithTelemetry(
      currentCache?.siblings || new Set<string>(),
      "MetaWidgetGenerator.updateSiblings.siblings",
    );

    const isCandidateListWidget =
      this.nestedViewIndex === 0 || !this.nestedViewIndex;
    const isCandidateWidget = isCandidateListWidget && viewIndex === 0;
    let candidateWidgetId = currentCache?.candidateWidgetId;

    siblings.add(originalMetaWidgetId);

    if (isCandidateWidget) {
      candidateWidgetId = metaWidget.widgetId;
    }

    const updatedCache = {
      ...referenceCache,
      [templateWidgetId]: {
        siblings,
        candidateWidgetId,
      },
    };

    this.setWidgetReferenceCache(updatedCache);

    if (!isCandidateWidget && candidateWidgetId) {
      this.siblings[candidateWidgetId] = [...siblings];
    }
  };

  private getSiblings = (templateWidgetId: string) => {
    const referenceCache = this.getWidgetReferenceCache();
    const currentCache = referenceCache?.[templateWidgetId];
    const siblings = currentCache?.siblings || new Set();

    return [...siblings];
  };

  private getCurrentViewData = () => this.getSlicedByCurrentView(this.data);

  private getSlicedByCurrentView = (arr: unknown[]) => {
    if (this.serverSidePagination && typeof this.pageSize === "number") {
      const startIndex = 0;
      const endIndex = this.pageSize;

      return arr.slice(startIndex, endIndex);
    }

    const startIndex = this.getStartIndex();

    if (this.infiniteScroll) {
      if (this.virtualizer) {
        const virtualItems = this.virtualizer.getVirtualItems();
        const endIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;

        return arr.slice(startIndex, endIndex + 1);
      }

      return [];
    }

    if (typeof this.pageNo === "number" && typeof this.pageSize === "number") {
      const endIndex = startIndex + this.pageSize;

      return arr.slice(startIndex, endIndex);
    }

    return [];
  };

  getStartIndex = () => {
    if (this.infiniteScroll) {
      if (this.virtualizer) {
        const items = this.virtualizer.getVirtualItems();

        return items[0]?.index ?? 0;
      }
    } else if (
      typeof this.pageSize === "number" &&
      typeof this.pageNo === "number"
    ) {
      return this.pageSize * (this.pageNo - 1);
    }

    return 0;
  };

  getViewIndex = (rowIndex: number) => {
    const startIndex = this.getStartIndex();

    return rowIndex - startIndex;
  };

  getVirtualListHeight = () => {
    return this.virtualizer?.getTotalSize?.();
  };

  private getRowTemplateCache = (
    key: string,
    templateWidgetId: string,
    options = {
      keepMetaWidgetData: false,
    },
  ) => {
    const templateCache = this.getRowCache(key)?.[templateWidgetId];

    if (
      templateCache &&
      this.renderMode === RenderModes.CANVAS &&
      this.templateWidgetCandidates.has(templateCache.metaWidgetId) &&
      !options.keepMetaWidgetData
    ) {
      const { templateWidgetId, templateWidgetName, type } = templateCache;

      return {
        ...templateCache,
        metaWidgetId: templateWidgetId,
        metaWidgetName: templateWidgetName,
        entityDefinition: this.getPropertiesOfWidget(templateWidgetName, type),
      };
    }

    return templateCache;
  };

  private getRowReferences = (key: string) => {
    const templateCache = this.getRowCache(key) || {};
    const templateWidgetIds = Object.keys(templateCache);
    const references: Record<string, string | undefined> = {};

    templateWidgetIds.forEach((templateWidgetId) => {
      const rowTemplateCache = this.getRowTemplateCache(key, templateWidgetId);

      references[templateWidgetId] = rowTemplateCache?.metaWidgetId;
    });

    return references;
  };

  private getRowCache = (key: string) => {
    return this.getWidgetCache()?.[key];
  };

  private getCache = () => {
    return this.getWidgetCache();
  };

  private setCache = (data: MetaWidgetCache) => {
    return this.setWidgetCache(data);
  };

  getContainerParentCache = () => {
    return this.getRowTemplateCache(ROOT_ROW_KEY, ROOT_CONTAINER_PARENT_KEY);
  };

  private getReferencesEntityDefMap = (value: string, key: string) => {
    const metaWidgetsMap = this.getRowCacheGroupByTemplateWidgetName(key);
    const dependantBinding: Record<string, string> = {};

    if (metaWidgetsMap) {
      // All the template widget names
      const templateWidgetNames = Object.keys(metaWidgetsMap);

      /**
       * Loop through all the template widget names and check if the
       * property have uses any of the template widgets name
       * Eg -
       *  property value -> "{{currentView.Input1.value}}"
       *  templateWidgetNames -> ["Text1", "Input1", "Image1"]
       *  dependantTemplateWidgets -> ["Input1"]
       */
      templateWidgetNames.forEach((templateWidgetName) => {
        if (value.includes(templateWidgetName)) {
          const dependantMetaWidget = metaWidgetsMap[templateWidgetName];

          // "Input1: { value: List1_Input1_1.value, text: List1_Input1_1.text }"
          dependantBinding[templateWidgetName] = `
            ${templateWidgetName}: {${
              dependantMetaWidget?.entityDefinition || ""
            }}
          `;
        }
      });
    }

    return dependantBinding;
  };

  private getRowCacheGroupByTemplateWidgetName = (key: string) => {
    // For all the template widgets, create a map between the template widget name and
    // the meta widget cache data

    return Object.values(this.currTemplateWidgets || {}).reduce(
      (acc, templateWidget) => {
        acc[templateWidget.widgetName] = this.getRowTemplateCache(
          key,
          templateWidget.widgetId,
        );

        return acc;
      },
      {} as Record<string, MetaWidgetCacheProps | undefined>,
    );
  };

  getMetaContainers = () => {
    const containers = { ids: [] as string[], names: [] as string[] };
    const startIndex = this.getStartIndex();
    const currentViewData = this.getCurrentViewData();

    currentViewData.forEach((_datum, viewIndex) => {
      const rowIndex = startIndex + viewIndex;
      const key = this.getPrimaryKey(rowIndex);
      const metaContainer = this.getRowTemplateCache(
        key,
        this.containerWidgetId,
      );

      if (!containers.ids) {
        containers.ids = [];
        containers.names = [];
      }

      if (metaContainer) {
        containers.ids.push(metaContainer.metaWidgetId);
        containers.names.push(metaContainer.metaWidgetName);
      }
    });

    return containers;
  };

  private getContainerWidget = () =>
    this.currTemplateWidgets?.[this.containerWidgetId] as FlattenedWidgetProps;

  getPrimaryKey = (rowIndex: number): string => {
    const viewIndex = this.getViewIndex(rowIndex);

    return this.primaryKeys[viewIndex];
  };

  getTemplateWidgetIdByMetaWidgetId = (metaWidgetId: string) => {
    return this.metaIdToTemplateIdMap[metaWidgetId];
  };

  private getCurrentRowMetaWidgets = (
    key: string,
    options = {
      keepMetaWidgetData: false,
    },
  ) => {
    const templateWidgetIds = Object.keys(this.currTemplateWidgets || {});

    const metaWidgets: MetaWidgetCacheProps[] = [];

    templateWidgetIds.forEach((templateWidgetId) => {
      const rowTemplateCache = this.getRowTemplateCache(
        key,
        templateWidgetId,
        options,
      );

      if (rowTemplateCache) {
        metaWidgets.push(rowTemplateCache);
      }
    });

    return metaWidgets;
  };

  private getEntityDefinitionsFor = (
    widgetType: string,
    blacklistedWidgetProperties?: string[],
  ) => {
    const config = WidgetFactory.getAutocompleteDefinitions(widgetType);
    const entityDefinition =
      typeof config === "function" ? config({} as WidgetProps) : config;
    const blacklistedKeys = ["!doc", "!url"].concat(
      blacklistedWidgetProperties || [],
    );

    return Object.keys(omit(entityDefinition, blacklistedKeys));
  };

  private getPropertiesOfWidget = (
    widgetName: string,
    widgetType: string,
    blacklistedWidgetProperties?: string[],
  ) => {
    const entityDefinitions = this.getEntityDefinitionsFor(
      widgetType,
      blacklistedWidgetProperties,
    );

    return entityDefinitions
      .map((definition) => `${definition}: ${widgetName}.${definition}`)
      .join(",");
  };

  private getContainerBinding = (metaWidgets: MetaWidgetCacheProps[]) => {
    const widgetsProperties: string[] = [];

    metaWidgets.forEach((metaWidget) => {
      const { metaWidgetName, templateWidgetId, templateWidgetName, type } =
        metaWidget;
      const properties = this.getPropertiesOfWidget(metaWidgetName, type);
      const isContainer = templateWidgetId === this.containerWidgetId;

      if (!isEmpty(properties) && !isContainer) {
        widgetsProperties.push(`
          ${templateWidgetName}: { ${properties} }
        `);
      }
    });

    return `
      {
        ${widgetsProperties.join(",")}
      }
    `;
  };

  getRowContainerWidgetName = (rowIndex: number) => {
    if (rowIndex === -1) {
      return;
    }

    const key = this.getPrimaryKey(rowIndex);

    return this.getRowTemplateCache(key, this.containerWidgetId, {
      keepMetaWidgetData: true,
    })?.metaWidgetName;
  };

  private resetCache = () => {
    this.setWidgetCache({});
  };

  private initVirtualizer = () => {
    const options = this.virtualizerOptions();

    if (options) {
      this.virtualizer = new Virtualizer<HTMLDivElement, HTMLDivElement>(
        options,
      );
      this.virtualizer._willUpdate();
    }
  };

  private updateCurrCachedRows = (keys: Set<string>) => {
    this.cachedItemKeys.curr = keys;
  };

  /**
   * This function is to update the cached list data(this.cachedKeyDataMap) with the updated data in this.data.
   */
  shouldUpdateCachedKeyDataMap = () => {
    return Array.from(this.cachedItemKeys.curr).some((key) => {
      const isKeyInPrimaryKey = this.primaryKeys.includes(key);

      if (!isKeyInPrimaryKey) return false;

      const viewIndex = this.primaryKeys.indexOf(key);

      return !isEqual(this.data[viewIndex], this.cachedKeyDataMap[key]);
    });
  };

  private getDataForCacheKey = (key: string) => {
    if (this.primaryKeys?.includes(key)) {
      const viewIndex = this.primaryKeys.indexOf(key);

      return this.data[viewIndex];
    }

    const rowIndex = this.getRowIndexFromPrimaryKey(key);

    if (!isNil(rowIndex)) {
      const viewIndex = this.getViewIndex(rowIndex);

      return this.data[viewIndex];
    }
  };

  /**
   * The Rows to be cached would be stored in this.cachedRows
   * The Data in these rows would be cached in this.cachedKeyDataMap
   */
  handleCachedKeys = (keys: Set<string>) => {
    this.updateCurrCachedRows(keys);
    this.updateCachedKeyDataMap(keys);
  };

  getCurrCachedRows = () => this.cachedItemKeys.curr;

  /**
   * We want to always get the current data before checking the cache
   * in case the data changes.
   *
   * when Selected Row(Key) is in Current Page
   * 1. Check PrimaryKey for SelectedKey
   * 2. Check widgetCache for rowIndex and check if in view,
   *
   * else fall back to data cache.
   */
  private updateCachedKeyDataMap = (keys: Set<string>) => {
    const cachedKeyDataMap: CachedKeyDataMap = {};

    keys.forEach((key) => {
      const data = this.getDataForCacheKey(key);

      if (data) {
        cachedKeyDataMap[key] = data;
      } else {
        cachedKeyDataMap[key] = this.cachedKeyDataMap[key];
      }
    });

    this.cachedKeyDataMap = { ...cachedKeyDataMap };
  };

  private unmountVirtualizer = () => {
    if (this.virtualizer) {
      const cleanup = this.virtualizer._didMount();

      cleanup();
      this.virtualizer = undefined;
    }
  };

  private remeasureVirtualizer = () => {
    if (this.virtualizer) {
      this.virtualizer.measure();
      this.virtualizer._didMount()();

      const options = this.virtualizerOptions();

      if (options) {
        this.virtualizer.setOptions(options);
      }

      this.virtualizer._willUpdate();
    }
  };

  private virtualizerOptions = (): VirtualizerOptionsProps | undefined => {
    const scrollElement = this.scrollElement;

    // Refer: https://github.com/TanStack/virtual/blob/beta/packages/react-virtual/src/index.tsx
    // for appropriate usage of the core api directly.

    if (scrollElement) {
      return {
        count: this.data?.length || 0,
        estimateSize: () => {
          const listCount = this.data?.length || 0;
          const itemSpacing =
            listCount && ((listCount - 1) * this.itemSpacing) / listCount;

          return this.templateHeight + itemSpacing;
        },
        getScrollElement: () => scrollElement,
        observeElementOffset,
        observeElementRect,
        scrollToFn: elementScroll,
        onChange: this.onVirtualListScroll,
        overscan: 2,
      };
    }
  };
}

// Class is already exported as default above
