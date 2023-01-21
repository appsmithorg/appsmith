import hash from "object-hash";
import { klona } from "klona";
import {
  difference,
  omit,
  set,
  get,
  isEmpty,
  isString,
  debounce,
} from "lodash";
import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  Virtualizer,
  VirtualizerOptions,
} from "@tanstack/virtual-core";
import isEqual from "fast-deep-equal/es6";

import Queue from "./Queue";
import { entityDefinitions } from "@appsmith/utils/autocomplete/EntityDefinitions";
import { extractTillNestedListWidget } from "./widget/helper";
import { FlattenedWidgetProps } from "widgets/constants";
import { generateReactKey } from "utils/generators";
import {
  GridDefaults,
  RenderModes,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import {
  DEFAULT_TEMPLATE_BOTTOM_ROW,
  DynamicPathType,
  LevelData,
  ListWidgetProps,
  MetaWidget,
  MetaWidgetCache,
  MetaWidgetCacheProps,
  MetaWidgets,
  RowDataCache,
} from "./widget";
import { WidgetProps } from "widgets/BaseWidget";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";

type TemplateWidgets = ListWidgetProps<
  WidgetProps
>["flattenedChildCanvasWidgets"];

type ReferenceCache = Record<
  string,
  | {
      siblings?: Set<string>;
      callback?: () => void;
    }
  | undefined
>;

type UpdateSiblingsOptions = {
  templateWidgetId: string;
  originalMetaWidgetId: string;
  metaWidget: MetaWidget;
};

export type HookOptions = {
  childMetaWidgets: MetaWidgets;
  rowReferences: Record<string, string | undefined>;
};

type Hook = (metaWidget: MetaWidget, options: HookOptions) => void;

type Hooks = {
  afterMetaWidgetGenerate?: Hook;
};

export type GeneratorOptions = {
  containerParentId: string;
  containerWidgetId: string;
  currTemplateWidgets: TemplateWidgets;
  prevTemplateWidgets?: TemplateWidgets;
  data: Record<string, unknown>[];
  hooks?: Hooks;
  itemSpacing: number;
  infiniteScroll: ConstructorProps["infiniteScroll"];
  levelData?: LevelData;
  nestedViewIndex?: number;
  pageNo?: number;
  pageSize?: number;
  primaryKeys?: (string | number | undefined)[];
  scrollElement: HTMLDivElement | null;
  serverSidePagination: boolean;
  templateBottomRow: number;
  widgetName: string;
};

export type ConstructorProps = {
  getWidgetCache: () => MetaWidgetCache | undefined;
  getWidgetReferenceCache: () => ReferenceCache | undefined;
  infiniteScroll: boolean;
  isListCloned: boolean;
  level: number;
  onVirtualListScroll: () => void;
  onMetaWidgetsUpdate: (metaWidgets: MetaWidgets) => void;
  prefixMetaWidgetId: string;
  primaryWidgetType: string;
  renderMode: string;
  setWidgetCache: (data: MetaWidgetCache) => void;
  setWidgetReferenceCache: (data: ReferenceCache) => void;
};

type TemplateWidgetStatus = {
  added: Set<string>;
  updated: Set<string>;
  removed: Set<string>;
  unchanged: Set<string>;
};

type CacheDataOption = {
  keepMetaWidgetData: boolean;
  key: string;
};

type GenerateMetaWidgetProps = {
  rowIndex: number;
  templateWidgetId: string;
  parentId: string;
  options?: CacheDataOption;
};

type GenerateMetaWidgetChildrenProps = {
  rowIndex: number;
  parentId: string;
  templateWidget: FlattenedWidgetProps;
  options?: CacheDataOption;
};

type GeneratedMetaWidget = {
  metaWidgetId?: string;
  metaWidgetName?: string;
  childMetaWidgets?: MetaWidgets;
  metaWidget?: MetaWidget;
};

type CachedRows = {
  prev: Set<string>;
  curr: Set<string>;
};

type LevelProperty = {
  currentIndex: number;
  currentItem: string;
  currentView: Record<string, string>;
};

type VirtualizerInstance = Virtualizer<HTMLDivElement, HTMLDivElement>;
type VirtualizerOptionsProps = VirtualizerOptions<
  HTMLDivElement,
  HTMLDivElement
>;

type AddDynamicPathsPropertiesOptions = {
  excludedPaths?: string[];
};

enum MODIFICATION_TYPE {
  LEVEL_DATA_UPDATED = "LEVEL_DATA_UPDATED",
  PAGE_NO_UPDATED = "PAGE_NO_UPDATED",
  REGENERATE_META_WIDGETS = "REGENERATE_META_WIDGETS",
  UPDATE_CONTAINER = "UPDATE_CONTAINER",
  GENERATE_CACHE_WIDGETS = "GENERATE_CACHE_WIDGETS",
}

const ROOT_CONTAINER_PARENT_KEY = "__$ROOT_CONTAINER_PARENT$__";
const ROOT_ROW_KEY = "__$ROOT_KEY$__";
const BLACKLISTED_ENTITY_DEFINITION: Record<string, string[] | undefined> = {
  LIST_WIDGET_V2: ["currentItemsView"],
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

class MetaWidgetGenerator {
  private batchSiblingUpdates: MetaWidgets;
  private cacheIndexArr: number[];
  private cachedRows: CachedRows;
  private containerParentId: GeneratorOptions["containerParentId"];
  private containerWidgetId: GeneratorOptions["containerWidgetId"];
  private currTemplateWidgets: TemplateWidgets;
  private currViewMetaWidgetIds: string[];
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
  private onMetaWidgetsUpdate: ConstructorProps["onMetaWidgetsUpdate"];
  private pageNo?: number;
  private pageSize?: number;
  private prefixMetaWidgetId: string;
  private prevOptions?: GeneratorOptions;
  private prevTemplateWidgets: TemplateWidgets;
  private prevViewMetaWidgetIds: string[];
  private primaryKeys: GeneratorOptions["primaryKeys"];
  private primaryWidgetType: ConstructorProps["primaryWidgetType"];
  private renderMode: ConstructorProps["renderMode"];
  private rowDataCache: RowDataCache;
  private scrollElement: GeneratorOptions["scrollElement"];
  private serverSidePagination: GeneratorOptions["serverSidePagination"];
  private setWidgetCache: ConstructorProps["setWidgetCache"];
  private setWidgetReferenceCache: ConstructorProps["setWidgetReferenceCache"];
  private templateBottomRow: GeneratorOptions["templateBottomRow"];
  private templateWidgetCandidates: Set<string>;
  private templateWidgetStatus: TemplateWidgetStatus;
  private virtualizer?: VirtualizerInstance;
  private widgetName: GeneratorOptions["widgetName"];

  constructor(props: ConstructorProps) {
    this.batchSiblingUpdates = {};
    this.cacheIndexArr = [];
    this.cachedRows = {
      prev: new Set(),
      curr: new Set(),
    };
    this.containerParentId = "";
    this.containerWidgetId = "";
    this.currViewMetaWidgetIds = [];
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
    this.onMetaWidgetsUpdate = props.onMetaWidgetsUpdate;
    this.pageNo = 1;
    this.pageSize = 0;
    this.prefixMetaWidgetId = props.prefixMetaWidgetId;
    this.prevTemplateWidgets = {};
    this.prevViewMetaWidgetIds = [];
    this.primaryWidgetType = props.primaryWidgetType;
    this.serverSidePagination = false;
    this.renderMode = props.renderMode;
    this.rowDataCache = {};
    this.modificationsQueue = new Queue<MODIFICATION_TYPE>();
    this.scrollElement = null;
    this.setWidgetCache = props.setWidgetCache;
    this.setWidgetReferenceCache = props.setWidgetReferenceCache;
    this.templateBottomRow = DEFAULT_TEMPLATE_BOTTOM_ROW;
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
    this.updateModificationsQueue(options);

    this.containerParentId = options.containerParentId;
    this.containerWidgetId = options.containerWidgetId;
    this.data = options.data;
    this.itemSpacing = options.itemSpacing;
    this.infiniteScroll = options.infiniteScroll;
    this.levelData = options.levelData;
    this.nestedViewIndex = options.nestedViewIndex;
    this.pageNo = options.pageNo;
    this.pageSize = options.pageSize;
    this.primaryKeys = options.primaryKeys;
    this.scrollElement = options.scrollElement;
    this.serverSidePagination = options.serverSidePagination;
    this.templateBottomRow = options.templateBottomRow;
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

    const prevOptions = klona(this.prevOptions);
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
    const data = this.getData();
    const dataCount = data.length;
    const indices = Array.from(Array(dataCount).keys());
    const containerParentWidget = this?.currTemplateWidgets?.[
      this.containerParentId
    ];
    let metaWidgets: MetaWidgets = {};

    if (
      this.modificationsQueue.has(MODIFICATION_TYPE.REGENERATE_META_WIDGETS)
    ) {
      // Reset
      this.currViewMetaWidgetIds = [];
      this.templateWidgetCandidates = new Set();

      this.generateWidgetCacheForContainerParent(containerParentWidget);
      this.updateTemplateWidgetStatus();

      if (dataCount > 0) {
        const startIndex = this.getStartIndex();

        indices.forEach((viewIndex) => {
          const rowIndex = startIndex + viewIndex;

          this.generateWidgetCacheData(rowIndex, viewIndex);

          const {
            childMetaWidgets,
            metaWidget,
          } = this.generateMetaWidgetRecursively({
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
      const cachedTemplateMetaWidgets = this.getCachedTemplateMetaWidgets();

      metaWidgets = { ...metaWidgets, ...cachedTemplateMetaWidgets };
      this.cachedRows.prev = new Set(this.cachedRows.curr);
    }

    this.prevViewMetaWidgetIds = [...this.currViewMetaWidgetIds];

    this.flushModificationQueue();

    return {
      metaWidgets,
      removedMetaWidgetIds,
    };
  };

  getCachedTemplateMetaWidgets = () => {
    let cachedTemplateMetaWidgets: MetaWidgets = {};

    this.cachedRows.curr.forEach((key) => {
      const rowIndex = this.getRowIndexFromPrimaryKey(key);
      const isClonedRow = this.isClonedRow(rowIndex);

      /**
       * We only want to generate metaWidgets in the templateRow if getCachedTemplateMetaWidgets()
       * is called due to the addition of a new cacheRow.
       */
      if (!isEqual(this.cachedRows.curr, this.cachedRows.prev) && isClonedRow)
        return;

      const {
        childMetaWidgets,
        metaWidget,
      } = this.generateMetaWidgetRecursively({
        rowIndex,
        parentId: this.containerParentId,
        templateWidgetId: this.containerWidgetId,
        options: {
          keepMetaWidgetData: true,
          key,
        },
      });

      cachedTemplateMetaWidgets = {
        ...cachedTemplateMetaWidgets,
        ...childMetaWidgets,
      };
      if (metaWidget) {
        cachedTemplateMetaWidgets[metaWidget.widgetId] = metaWidget;
      }
    });

    return cachedTemplateMetaWidgets;
  };

  private generateMetaWidgetId = () =>
    `${this.prefixMetaWidgetId}_${generateReactKey()}`;

  private getMetaWidgetIdsInCachedRows = () => {
    const cachedMetaWidgetIds: string[] = [];
    const removedCachedMetaWidgetIds: string[] = [];

    this.cachedRows.prev.forEach((key) => {
      const metaCacheProps = this.getRowCache(key) ?? {};
      Object.values(metaCacheProps).forEach((cache) => {
        removedCachedMetaWidgetIds.push(cache.metaWidgetId);
      });
    });

    if (!this.cachedRows.curr.size)
      return { cachedMetaWidgetIds, removedCachedMetaWidgetIds };

    this.cachedRows.curr.forEach((key) => {
      const metaCacheProps = this.getRowCache(key) ?? {};
      Object.values(metaCacheProps).forEach((cache) => {
        cachedMetaWidgetIds.push(cache.metaWidgetId);
      });
    });

    return { cachedMetaWidgetIds, removedCachedMetaWidgetIds };
  };

  /**
   * The removed widgets are
   * 1. The removed widgets from view i.e diff from previous View and Current View
   * 2. The previously cached rows that are not in the current view
   */

  private getRemovedMetaWidgetIds = () => {
    const {
      cachedMetaWidgetIds,
      removedCachedMetaWidgetIds,
    } = this.getMetaWidgetIdsInCachedRows();

    const removedWidgetsFromView = new Set(
      difference(this.prevViewMetaWidgetIds, this.currViewMetaWidgetIds),
    );

    removedCachedMetaWidgetIds.forEach((widgetId) => {
      if (!this.currViewMetaWidgetIds.includes(widgetId))
        removedWidgetsFromView.add(widgetId);
    });

    cachedMetaWidgetIds.forEach((widgetId) => {
      removedWidgetsFromView.delete(widgetId);
    });

    return Array.from(removedWidgetsFromView);
  };

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

    const metaWidget = klona(templateWidget) as MetaWidget;
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
    const {
      children,
      metaWidgets: childMetaWidgets,
    } = this.generateMetaWidgetChildren({
      rowIndex,
      templateWidget,
      parentId: metaWidgetId,
      options,
    });

    if (
      !this.shouldGenerateMetaWidgetFor(templateWidget.widgetId, key) &&
      !options?.keepMetaWidgetData
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

    if (isMainContainerWidget) {
      this.disableResizeHandles(metaWidget);
    }

    if (templateWidget.type === this.primaryWidgetType) {
      this.addLevelData(metaWidget, rowIndex, key);
      metaWidget.prefixMetaWidgetId = this.prefixMetaWidgetId;
      metaWidget.nestedViewIndex = viewIndex;
    }

    if (this.isRowNonConfigurable(metaCacheProps)) {
      this.disableWidgetOperations(metaWidget);
      metaWidget.suppressAutoComplete = true;
      metaWidget.suppressDebuggerError = true;
    }

    metaWidget.currentIndex = this.serverSidePagination ? viewIndex : rowIndex;
    metaWidget.widgetId = metaWidgetId;
    metaWidget.widgetName = metaWidgetName;
    metaWidget.children = children;
    metaWidget.parentId = parentId;
    metaWidget.referencedWidgetId = templateWidgetId;
    metaWidget.metaWidgetId = originalMetaWidgetId;

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
      const {
        childMetaWidgets,
        metaWidget,
        metaWidgetId,
      } = this.generateMetaWidgetRecursively({
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
    const isClonedRow = this.isClonedRow(rowIndex);
    const templateWidgets = Object.values(this.currTemplateWidgets || {}) || [];
    const updatedRowCache: MetaWidgetCache[string] = {};

    templateWidgets.forEach((templateWidget) => {
      const {
        type,
        widgetId: templateWidgetId,
        widgetName: templateWidgetName,
      } = templateWidget;

      if (templateWidgetId === this.containerParentId) return;

      const currentCache = rowCache[templateWidgetId] || {};
      const metaWidgetId =
        currentCache.metaWidgetId || this.generateMetaWidgetId();
      const metaWidgetName = `${this.widgetName}_${templateWidgetName}_${metaWidgetId}`;
      const entityDefinition =
        currentCache.entityDefinition ||
        this.getPropertiesOfWidget(metaWidgetName, type);

      if (!isClonedRow) {
        this.templateWidgetCandidates.add(metaWidgetId);
        this.currViewMetaWidgetIds.push(templateWidgetId);
      } else {
        this.currViewMetaWidgetIds.push(metaWidgetId);
      }

      this.metaIdToTemplateIdMap[metaWidgetId] = templateWidgetId;

      updatedRowCache[templateWidgetId] = {
        entityDefinition,
        prevRowIndex: currentCache.rowIndex,
        rowIndex,
        metaWidgetId,
        metaWidgetName,
        viewIndex,
        templateWidgetId,
        templateWidgetName,
        type,
        originalMetaWidgetId: metaWidgetId,
        originalMetaWidgetName: metaWidgetName,
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
      const currentCache = rowCache[ROOT_CONTAINER_PARENT_KEY] || {};
      const updatedRowCache: MetaWidgetCache[string] = {};
      const {
        type,
        widgetId: containerParentId,
        widgetName: containerParentName,
      } = templateWidget;

      const metaWidgetId = this.isListCloned
        ? currentCache.metaWidgetId || this.generateMetaWidgetId()
        : containerParentId;

      const metaWidgetName = this.isListCloned
        ? `${this.widgetName}_${containerParentName}_${metaWidgetId}`
        : containerParentName;

      updatedRowCache[ROOT_CONTAINER_PARENT_KEY] = {
        metaWidgetId,
        metaWidgetName,
        type,
        rowIndex: -1,
        viewIndex: -1,
        entityDefinition: {},
        templateWidgetId: containerParentId,
        templateWidgetName: containerParentName,
        originalMetaWidgetId: metaWidgetId,
        originalMetaWidgetName: metaWidgetName,
      };

      this.setRowCache(ROOT_ROW_KEY, {
        ...rowCache,
        ...updatedRowCache,
      });
    }
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
    const data = this.getData();
    const currentIndex = this.serverSidePagination
      ? this.getViewIndex(rowIndex)
      : rowIndex;
    const dataBinding =
      this.serverSidePagination && this.cachedRows.curr.has(key)
        ? `{{${JSON.stringify(this.rowDataCache[key])}}}`
        : `{{${this.widgetName}.listData[${currentIndex}]}}`;
    const currentItem = dataBinding;
    const currentRowCache = this.getRowCacheGroupByTemplateWidgetName(key);
    const metaContainers = this.getMetaContainers();
    const metaContainerName = metaContainers.names[0];
    const blacklistedCacheKeys = [
      "originalMetaWidgetId",
      "originalMetaWidgetName",
      "prevRowIndex",
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
          currentItem: data?.[0],
          // Uses any one of the row's container present on the List widget to
          // get the object of current row for autocomplete
          currentView: `{{${metaContainerName}.data}}`,
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
    if (metaWidgetName === templateWidgetName) return binding;

    const pattern = new RegExp(`${templateWidgetName}\\.`, "g");

    return binding.replace(pattern, `${metaWidgetName}.`);
  };

  private addDynamicPathsProperties = (
    metaWidget: MetaWidget,
    metaWidgetCacheProps: MetaWidgetCacheProps,
    key: string,
    options: AddDynamicPathsPropertiesOptions = {},
  ) => {
    const { metaWidgetName, templateWidgetName } = metaWidgetCacheProps;
    const { excludedPaths = [] } = options;
    const dynamicPaths = [
      ...(metaWidget.dynamicBindingPathList || []),
      ...(metaWidget.dynamicTriggerPathList || []),
    ];
    let referencesEntityDef: Record<string, string> = {};
    const pathTypes = new Set();

    if (!dynamicPaths.length) return;

    dynamicPaths.forEach(({ key: path }) => {
      if (excludedPaths.includes(path)) return;

      let propertyValue: string = get(metaWidget, path);

      propertyValue = this.updateWidgetNameInDynamicBinding(
        propertyValue,
        metaWidgetName,
        templateWidgetName,
      );
      const { jsSnippets, stringSegments } = getDynamicBindings(propertyValue);
      const js = combineDynamicBindings(jsSnippets, stringSegments);

      if (hasCurrentItem(propertyValue)) {
        this.addCurrentItemProperty(metaWidget, metaWidgetName, key);
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

          levelPaths.forEach((levelPath) => {
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
        const propertyBinding = `{{((${prefix}) => ${js})(${suffix})}}`;

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

  private addCurrentItemProperty = (
    metaWidget: MetaWidget,
    metaWidgetName: string,
    key: string,
  ) => {
    if (metaWidget.currentItem) return;

    const dataBinding =
      this.serverSidePagination && this.cachedRows.curr.has(key)
        ? `{{${JSON.stringify(this.rowDataCache[key])}}}`
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
        const { entityDefinition } =
          lookupLevel?.currentRowCache?.[widgetName] || {};

        if (entityDefinition) {
          levelProps[level] = {
            ...(levelProps[level] || {}),
            currentView: {
              ...(levelProps[level]?.currentView || {}),
              [widgetName]: `{{{${entityDefinition}}}}`,
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

  private updateModificationsQueue = (nextOptions: GeneratorOptions) => {
    if (
      this.itemSpacing !== nextOptions.itemSpacing ||
      this.infiniteScroll != nextOptions.infiniteScroll
    ) {
      this.modificationsQueue.add(MODIFICATION_TYPE.UPDATE_CONTAINER);
    }
    /**
     * (Operation) Moving to Next Page
     * 2 Things would change at different times,
     * page No would change immediately -> causes regeneration of meta widgets
     * Data would later change -> this is only communicated by primaryKey since the data.length is still constant.
     * But once primaryKey is undefined, This change in data isn't known.
     * We would need regenerate the meta widgets only at these points.
     */

    if (
      this.hasRegenerationOptionsChanged(nextOptions) ||
      (this.primaryKeys === undefined &&
        nextOptions.primaryKeys === undefined &&
        this.serverSidePagination)
    ) {
      this.modificationsQueue.add(MODIFICATION_TYPE.REGENERATE_META_WIDGETS);
    }

    if (this.levelData !== nextOptions.levelData) {
      this.modificationsQueue.add(MODIFICATION_TYPE.LEVEL_DATA_UPDATED);
    }

    if (this.pageNo !== nextOptions.pageNo) {
      this.modificationsQueue.add(MODIFICATION_TYPE.PAGE_NO_UPDATED);
    }
    if (this.shouldGenerateCacheWidgets(nextOptions)) {
      this.modificationsQueue.add(MODIFICATION_TYPE.GENERATE_CACHE_WIDGETS);
    }
  };

  /**
   * Only generate cache widget when template widget property changes
   * or new template widgets are added
   * or new cached row is added (further conditions are done in getCachedTemplateMetaWidgets to ensure
   * its only generated for the template row, the usual filtering of metaWidgetIds is used to cache rows)
   *
   */
  private shouldGenerateCacheWidgets = (nextOptions: GeneratorOptions) => {
    return (
      (!isEqual(this.currTemplateWidgets, nextOptions.currTemplateWidgets) ||
        !isEqual(this.cachedRows.curr, this.cachedRows.prev)) &&
      this.renderMode !== RenderModes.PAGE
    );
  };

  /**
   * rowIndex is used to get the state of the row(isClonedRow)
   * The rowIndex changes in live data so we need to
   * 1. if Key is in primaryKeys i.e the row is in currentView, we use rowIndex
   * 2. if key isn't in primaryKeys i.e it's a cachedRow and we're in a diff page, we use prevRowIndex
   */
  private getRowIndexFromPrimaryKey = (key: string) => {
    const rowCache = this.getRowCache(key) ?? {};
    const rowIndex = this.primaryKeys?.toString().includes(key)
      ? rowCache[this.containerWidgetId].rowIndex
      : rowCache[this.containerWidgetId]?.prevRowIndex ??
        rowCache[this.containerWidgetId].rowIndex;
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

  private isClonedRow = (rowIndex: number) => {
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
    const { metaWidgetId, prevRowIndex, rowIndex, type } =
      this.getRowTemplateCache(key, templateWidgetId) || {};
    const { added, removed, unchanged } = this.templateWidgetStatus;
    const templateWidgetsAddedOrRemoved = added.size > 0 || removed.size > 0;
    const isMainContainerWidget = templateWidgetId === this.containerWidgetId;
    const isMetaWidgetPresentInCurrentView =
      metaWidgetId && this.prevViewMetaWidgetIds.includes(metaWidgetId);
    const hasTemplateWidgetChanged = !unchanged.has(templateWidgetId);
    const containerUpdateRequired = this.modificationsQueue.has(
      MODIFICATION_TYPE.UPDATE_CONTAINER,
    );
    const levelDataUpdated = this.modificationsQueue.has(
      MODIFICATION_TYPE.LEVEL_DATA_UPDATED,
    );
    const shouldMainContainerUpdate =
      templateWidgetsAddedOrRemoved || containerUpdateRequired;
    const pageNoUpdated = this.modificationsQueue.has(
      MODIFICATION_TYPE.PAGE_NO_UPDATED,
    );
    const isClonedRow = this.isClonedRow(rowIndex || 0);

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
     * or
     * template row and pageNo updated (induces currentIndex change)
     */
    return (
      (isMainContainerWidget && shouldMainContainerUpdate) ||
      !isMetaWidgetPresentInCurrentView ||
      hasTemplateWidgetChanged ||
      (type === this.primaryWidgetType && templateWidgetsAddedOrRemoved) ||
      levelDataUpdated ||
      rowIndex !== prevRowIndex ||
      (!isClonedRow && pageNoUpdated)
    );
  };

  private hasRegenerationOptionsChanged = (nextOptions: GeneratorOptions) => {
    return (
      nextOptions.containerParentId !== this.containerParentId ||
      nextOptions.containerWidgetId !== this.containerWidgetId ||
      nextOptions.widgetName !== this.widgetName ||
      nextOptions.levelData !== this.levelData ||
      nextOptions?.currTemplateWidgets !== nextOptions?.prevTemplateWidgets ||
      nextOptions.data.length !== this.data.length ||
      nextOptions.infiniteScroll !== this.infiniteScroll ||
      nextOptions.itemSpacing !== this.itemSpacing ||
      nextOptions.pageNo !== this.pageNo ||
      nextOptions.pageSize !== this.pageSize ||
      nextOptions.primaryKeys !== this.primaryKeys ||
      nextOptions.serverSidePagination !== this.serverSidePagination ||
      nextOptions.templateBottomRow !== this.templateBottomRow
    );
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

  queueMetaWidgetUpdate = (metaWidget: MetaWidget) => {
    this.batchSiblingUpdates[metaWidget.widgetId] = metaWidget;

    this.onMetaWidgetsUpdateDebounced();
  };

  onMetaWidgetsUpdateDebounced = debounce(() => {
    this.onMetaWidgetsUpdate(this.batchSiblingUpdates);
  }, 2000);

  private buildReferenceUpdateCb = (
    metaWidget: MetaWidget,
    templateWidgetId: string,
  ) => {
    return () => {
      const siblings = this.getSiblings(templateWidgetId);
      const updatedMetaWidget = klona(metaWidget);
      updatedMetaWidget.siblingMetaWidgets = siblings;

      this.queueMetaWidgetUpdate(updatedMetaWidget);
    };
  };

  private updateSiblings = (
    rowIndex: number,
    options: UpdateSiblingsOptions,
  ) => {
    const { metaWidget, originalMetaWidgetId, templateWidgetId } = options;
    const viewIndex = this.getViewIndex(rowIndex);
    const referenceCache = klona(this.getWidgetReferenceCache());
    const currentCache = referenceCache?.[templateWidgetId];
    const siblings = klona(currentCache?.siblings || new Set<string>());
    const isCandidateListWidget =
      this.nestedViewIndex === 0 || !this.nestedViewIndex;
    const isCandidateWidget = isCandidateListWidget && viewIndex === 0;
    let callback = currentCache?.callback;

    siblings.add(originalMetaWidgetId);

    if (isCandidateWidget) {
      // add callback to the cache
      callback = this.buildReferenceUpdateCb(metaWidget, templateWidgetId);
    }

    const updatedCache = {
      ...referenceCache,
      [templateWidgetId]: {
        siblings,
        callback,
      },
    };

    this.setWidgetReferenceCache(updatedCache);

    if (!isCandidateListWidget) {
      // call callback
      currentCache?.callback?.();
    }
  };

  private getSiblings = (templateWidgetId: string) => {
    const referenceCache = klona(this.getWidgetReferenceCache());
    const currentCache = referenceCache?.[templateWidgetId];
    const siblings = currentCache?.siblings || new Set();

    return [...siblings];
  };

  private getData = () => {
    if (this.serverSidePagination) {
      return this.data;
    }

    const startIndex = this.getStartIndex();

    if (this.infiniteScroll) {
      if (this.virtualizer) {
        const virtualItems = this.virtualizer.getVirtualItems();
        const endIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;
        return this.data.slice(startIndex, endIndex + 1);
      }

      return [];
    }

    if (typeof this.pageNo === "number" && typeof this.pageSize === "number") {
      const endIndex = startIndex + this.pageSize;
      return this.data.slice(startIndex, endIndex);
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
      templateWidgetNames.filter((templateWidgetName) => {
        if (value.includes(templateWidgetName)) {
          const dependantMetaWidget = metaWidgetsMap[templateWidgetName];

          // "Input1: { value: List1_Input1_1.value, text: List1_Input1_1.text }"
          dependantBinding[templateWidgetName] = `
            ${templateWidgetName}: {${dependantMetaWidget?.entityDefinition ||
            ""}}
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
    this.getData().forEach((_datum, viewIndex) => {
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
    let dataIndex = rowIndex;

    if (this.serverSidePagination) {
      dataIndex = this.getViewIndex(rowIndex);
    }

    const key = this?.primaryKeys?.[dataIndex];
    if (typeof key === "number" || typeof key === "string") {
      return key.toString();
    }

    const data = this.getData()[dataIndex];
    const dataToHash = data ?? rowIndex;

    return hash(dataToHash, { algorithm: "md5" });
  };

  updateCurrCachedRows = (keys: string[]) => {
    this.cachedRows.curr = new Set(keys);
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

  private getEntityDefinitionsFor = (widgetType: string) => {
    const config = get(entityDefinitions, widgetType);
    const entityDefinition = typeof config === "function" ? config({}) : config;
    const blacklistedKeys = ["!doc", "!url"].concat(
      BLACKLISTED_ENTITY_DEFINITION[widgetType] || [],
    );

    return Object.keys(omit(entityDefinition, blacklistedKeys));
  };

  private getPropertiesOfWidget = (widgetName: string, widgetType: string) => {
    const entityDefinitions = this.getEntityDefinitionsFor(widgetType);

    return entityDefinitions
      .map((definition) => `${definition}: ${widgetName}.${definition}`)
      .join(",");
  };

  private getContainerBinding = (metaWidgets: MetaWidgetCacheProps[]) => {
    const widgetsProperties: string[] = [];
    metaWidgets.forEach((metaWidget) => {
      const {
        metaWidgetName,
        templateWidgetId,
        templateWidgetName,
        type,
      } = metaWidget;
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

  updateRowDataCache = (data: RowDataCache) => {
    this.rowDataCache = data;
  };

  getRowDataCache = () => this.rowDataCache;

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
          return this.templateBottomRow * 10 + itemSpacing;
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

export default MetaWidgetGenerator;
