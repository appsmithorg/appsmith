import hash from "object-hash";
import { klona } from "klona";
import { difference, omit, set, get, isEmpty, isString } from "lodash";
import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  Virtualizer,
  VirtualizerOptions,
} from "@tanstack/virtual-core";

import Queue from "./Queue";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { extractTillNestedListWidget } from "./widget/helper";
import { FlattenedWidgetProps } from "widgets/constants";
import { generateReactKey } from "utils/generators";
import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import {
  DEFAULT_TEMPLATE_BOTTOM_ROW,
  DynamicPathType,
  LevelData,
  ListWidgetProps,
  MetaWidget,
  MetaWidgetCache,
  MetaWidgetCacheProps,
  MetaWidgets,
} from "./widget";
import { WidgetProps } from "widgets/BaseWidget";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";

type TemplateWidgets = ListWidgetProps<
  WidgetProps
>["flattenedChildCanvasWidgets"];

export type GeneratorOptions = {
  cacheIndexArr: number[];
  containerParentId: string;
  containerWidgetId: string;
  currTemplateWidgets: TemplateWidgets;
  prevTemplateWidgets?: TemplateWidgets;
  data: Record<string, unknown>[];
  itemGap: number;
  infiniteScroll: ConstructorProps["infiniteScroll"];
  levelData?: LevelData;
  pageNo?: number;
  pageSize?: number;
  primaryKeys?: (string | number | undefined)[];
  scrollElement: HTMLDivElement | null;
  serverSidePagination: boolean;
  templateBottomRow: number;
  widgetName: string;
};

type ConstructorProps = {
  getWidgetCache: () => MetaWidgetCache | undefined;
  infiniteScroll: boolean;
  isListCloned: boolean;
  level: number;
  onVirtualListScroll: () => void;
  primaryWidgetType: string;
  renderMode: string;
  setWidgetCache: (data: MetaWidgetCache) => void;
  widgetId: string;
};

type TemplateWidgetStatus = {
  added: Set<string>;
  updated: Set<string>;
  removed: Set<string>;
  unchanged: Set<string>;
};

type GenerateMetaWidgetProps = {
  rowIndex: number;
  templateWidgetId: string;
  parentId: string;
};

type GenerateMetaWidgetChildrenProps = {
  rowIndex: number;
  parentId: string;
  templateWidget: FlattenedWidgetProps;
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
  UPDATE_CONTAINER = "UPDATE_CONTAINER",
  REGENERATE_META_WIDGETS = "REGENERATE_META_WIDGETS",
  LEVEL_DATA_UPDATED = "LEVEL_DATA_UPDATED",
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
  private cacheIndexArr: number[];
  private cachedRows: CachedRows;
  private containerParentId: GeneratorOptions["containerParentId"];
  private containerWidgetId: GeneratorOptions["containerWidgetId"];
  private currTemplateWidgets: TemplateWidgets;
  private currViewMetaWidgetIds: string[];
  private data: GeneratorOptions["data"];
  private getWidgetCache: ConstructorProps["getWidgetCache"];
  private itemGap: GeneratorOptions["itemGap"];
  private infiniteScroll: ConstructorProps["infiniteScroll"];
  private isListCloned: ConstructorProps["isListCloned"];
  private level: ConstructorProps["level"];
  private levelData: GeneratorOptions["levelData"];
  private metaIdToCacheMap: Record<string, string>;
  private modificationsQueue: Queue<MODIFICATION_TYPE>;
  private onVirtualListScroll: ConstructorProps["onVirtualListScroll"];
  private pageNo?: number;
  private pageSize?: number;
  private prevOptions?: GeneratorOptions;
  private prevTemplateWidgets: TemplateWidgets;
  private prevViewMetaWidgetIds: string[];
  private primaryKeys: GeneratorOptions["primaryKeys"];
  private primaryWidgetType: ConstructorProps["primaryWidgetType"];
  private renderMode: ConstructorProps["renderMode"];
  private scrollElement: GeneratorOptions["scrollElement"];
  private serverSidePagination: GeneratorOptions["serverSidePagination"];
  private setWidgetCache: ConstructorProps["setWidgetCache"];
  private templateBottomRow: GeneratorOptions["templateBottomRow"];
  private templateWidgetStatus: TemplateWidgetStatus;
  private virtualizer?: VirtualizerInstance;
  private widgetName: GeneratorOptions["widgetName"];

  constructor(props: ConstructorProps) {
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
    this.itemGap = 0;
    this.infiniteScroll = props.infiniteScroll;
    this.isListCloned = props.isListCloned;
    this.level = props.level;
    this.levelData = undefined;
    this.metaIdToCacheMap = {};
    this.onVirtualListScroll = props.onVirtualListScroll;
    this.pageNo = 1;
    this.pageSize = 0;
    this.prevTemplateWidgets = {};
    this.prevViewMetaWidgetIds = [];
    this.primaryWidgetType = props.primaryWidgetType;
    this.serverSidePagination = false;
    this.renderMode = props.renderMode;
    this.modificationsQueue = new Queue<MODIFICATION_TYPE>();
    this.scrollElement = null;
    this.setWidgetCache = props.setWidgetCache;
    this.templateBottomRow = DEFAULT_TEMPLATE_BOTTOM_ROW;
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

    this.cacheIndexArr = options.cacheIndexArr;
    this.containerParentId = options.containerParentId;
    this.containerWidgetId = options.containerWidgetId;
    this.data = options.data;
    this.itemGap = options.itemGap;
    this.infiniteScroll = options.infiniteScroll;
    this.levelData = options.levelData;
    this.pageNo = options.pageNo;
    this.pageSize = options.pageSize;
    this.primaryKeys = options.primaryKeys;
    this.scrollElement = options.scrollElement;
    this.serverSidePagination = options.serverSidePagination;
    this.templateBottomRow = options.templateBottomRow;
    this.widgetName = options.widgetName;
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
    this.resetCache();
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

    this.cacheRowIndices(this.cacheIndexArr);

    const removedMetaWidgetIds = this.getRemovedMetaWidgetIds();

    this.cachedRows.prev = new Set(this.cachedRows.curr);

    this.prevViewMetaWidgetIds = [...this.currViewMetaWidgetIds];

    this.flushModificationQueue();

    return {
      metaWidgets,
      removedMetaWidgetIds,
    };
  };

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

  private cacheRowIndices = (rowIndices: number[]) => {
    this.cachedRows.curr.clear();
    rowIndices.forEach((rowIndex) => {
      if (rowIndex !== -1 && isFinite(rowIndex)) {
        const key = this.getPrimaryKey(rowIndex);
        this.cachedRows.curr.add(key);
      }
    });
  };

  private generateMetaWidgetRecursively = ({
    parentId,
    rowIndex,
    templateWidgetId,
  }: GenerateMetaWidgetProps): GeneratedMetaWidget => {
    const templateWidget = this.currTemplateWidgets?.[templateWidgetId];

    if (!templateWidget)
      return { metaWidgetId: undefined, metaWidgetName: undefined };

    const key = this.getPrimaryKey(rowIndex);

    const metaWidget = klona(templateWidget) as MetaWidget;
    const metaCacheProps = this.getRowTemplateCache(key, templateWidgetId);

    if (!metaCacheProps) {
      return {
        childMetaWidgets: undefined,
        metaWidgetId: undefined,
        metaWidgetName: undefined,
      };
    }

    const { metaWidgetId, metaWidgetName } = metaCacheProps || {};
    const isMainContainerWidget = templateWidgetId === this.containerWidgetId;
    const viewIndex = this.getViewIndex(rowIndex);

    const {
      children,
      metaWidgets: childMetaWidgets,
    } = this.generateMetaWidgetChildren({
      rowIndex,
      templateWidget,
      parentId: metaWidgetId,
    });

    if (!this.shouldGenerateMetaWidgetFor(templateWidget.widgetId, key)) {
      return { childMetaWidgets, metaWidgetName, metaWidgetId };
    }

    if (isMainContainerWidget) {
      this.updateContainerPosition(metaWidget, rowIndex);
      this.updateContainerBindings(metaWidget, key);
      this.addDynamicPathsProperties(metaWidget, metaCacheProps, {
        excludedPaths: ["data"],
      });
    } else {
      this.addDynamicPathsProperties(metaWidget, metaCacheProps);
    }

    if (templateWidget.type === this.primaryWidgetType) {
      this.addLevelData(metaWidget, rowIndex);
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

    return {
      childMetaWidgets,
      metaWidget,
      metaWidgetId,
      metaWidgetName,
    };
  };

  private generateMetaWidgetChildren = ({
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
      const metaWidgetId = isClonedRow
        ? currentCache.metaWidgetId || generateReactKey()
        : templateWidgetId;

      const metaWidgetName = isClonedRow
        ? `${this.widgetName}_${templateWidgetName}_${metaWidgetId}`
        : templateWidgetName;

      const entityDefinition =
        currentCache.entityDefinition ||
        this.getPropertiesOfWidget(metaWidgetName, type);

      this.currViewMetaWidgetIds.push(metaWidgetId);

      this.metaIdToCacheMap[metaWidgetId] = `${key}.${templateWidgetId}`;

      updatedRowCache[templateWidgetId] = {
        entityDefinition,
        rowIndex,
        metaWidgetId,
        metaWidgetName,
        viewIndex,
        templateWidgetId,
        templateWidgetName,
        type,
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
        ? currentCache.metaWidgetId || generateReactKey()
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
      };

      this.setRowCache(ROOT_ROW_KEY, {
        ...rowCache,
        ...updatedRowCache,
      });
    }
  };

  private disableWidgetOperations = (metaWidget: FlattenedWidgetProps) => {
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

  /**
   *
   * levelData provides 2 information to the child list widget.
   * 1. parent list widget's currentView, currentItem and complete row's cache
   *  This helps child widget to fill in information where level_1 or level_2 property is used.
   * 2. provides auto-complete information.
   *  In the derived property of the List widget, the childAutoComplete property uses the currentItem and currentView
   *  to define the autocomplete suggestions.
   */
  private addLevelData = (metaWidget: MetaWidget, rowIndex: number) => {
    const key = this.getPrimaryKey(rowIndex);
    const data = this.getData();
    const currentIndex = this.serverSidePagination
      ? this.getViewIndex(rowIndex)
      : rowIndex;
    const currentItem = `{{${this.widgetName}.listData[${currentIndex}]}}`;
    const currentRowCache = this.getRowCacheGroupByTemplateWidgetName(key);
    const metaContainers = this.getMetaContainers();
    const metaContainerName = metaContainers.names[0];

    metaWidget.levelData = {
      ...this.levelData,
      [`level_${this.level}`]: {
        currentIndex,
        currentItem,
        currentRowCache,
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

  private addDynamicPathsProperties = (
    metaWidget: MetaWidget,
    metaWidgetCacheProps: MetaWidgetCacheProps,
    options: AddDynamicPathsPropertiesOptions = {},
  ) => {
    const { metaWidgetName, rowIndex } = metaWidgetCacheProps;
    const { excludedPaths = [] } = options;
    const key = this.getPrimaryKey(rowIndex);
    const dynamicPaths = [
      ...(metaWidget.dynamicBindingPathList || []),
      ...(metaWidget.dynamicTriggerPathList || []),
    ];
    let referencesEntityDef: Record<string, string> = {};

    if (!dynamicPaths.length) return;

    dynamicPaths.forEach(({ key: path }) => {
      if (excludedPaths.includes(path)) return;

      const propertyValue: string = get(metaWidget, path);
      const { jsSnippets, stringSegments } = getDynamicBindings(propertyValue);
      const js = combineDynamicBindings(jsSnippets, stringSegments);
      const pathTypes = new Set();

      if (hasCurrentItem(propertyValue)) {
        this.addCurrentItemProperty(metaWidget, metaWidgetName);
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

      const prefix = [...pathTypes].join(", ");
      const suffix = [...pathTypes]
        .map((type) => `${metaWidgetName}.${type}`)
        .join(", ");
      const propertyBinding = `{{((${prefix}) => ${js})(${suffix})}}`;

      set(metaWidget, path, propertyBinding);
    });

    this.addCurrentViewProperty(metaWidget, Object.values(referencesEntityDef));
  };

  private addCurrentItemProperty = (
    metaWidget: MetaWidget,
    metaWidgetName: string,
  ) => {
    if (metaWidget.currentItem) return;

    metaWidget.currentItem = `{{${this.widgetName}.listData[${metaWidgetName}.currentIndex]}}`;
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

  private updateContainerBindings = (metaWidget: MetaWidget, key: string) => {
    const currentRowMetaWidgets = this.getCurrentRowMetaWidgets(key);
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
    const gap = this.itemGap;
    const virtualItems = this.virtualizer?.getVirtualItems() || [];
    const virtualItem = virtualItems[viewIndex];
    const index = virtualItem ? virtualItem.index : viewIndex;

    const start = index * mainContainer.bottomRow;
    const end = (index + 1) * mainContainer.bottomRow;

    metaWidget.gap = gap;

    if (this.infiniteScroll) {
      metaWidget.rightColumn -= 1;
    }

    metaWidget.topRow =
      start + index * (this.itemGap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
    metaWidget.bottomRow =
      end + index * (this.itemGap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
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
      this.itemGap !== nextOptions.itemGap ||
      this.infiniteScroll != nextOptions.infiniteScroll
    ) {
      this.modificationsQueue.add(MODIFICATION_TYPE.UPDATE_CONTAINER);
    }

    if (this.hasRegenerationOptionsChanged(nextOptions)) {
      this.modificationsQueue.add(MODIFICATION_TYPE.REGENERATE_META_WIDGETS);
    }

    if (this.levelData !== nextOptions.levelData) {
      this.modificationsQueue.add(MODIFICATION_TYPE.LEVEL_DATA_UPDATED);
    }
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
    return (
      this.renderMode === RenderModes.PAGE ||
      (this.renderMode === RenderModes.CANVAS && rowIndex !== 0) ||
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
    const { metaWidgetId, type } =
      this.getRowTemplateCache(key, templateWidgetId) || {};
    const { added, removed, unchanged } = this.templateWidgetStatus;
    const templateWidgetsAddedOrRemoved = added.size > 0 || removed.size > 0;
    const isMainContainerWidget = templateWidgetId === this.containerWidgetId;
    const isMetaWidgetPresentInCurrentView =
      metaWidgetId && this.prevViewMetaWidgetIds.includes(metaWidgetId);
    const isTemplateWidgetChanged = !unchanged.has(templateWidgetId);
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
     */

    return (
      (isMainContainerWidget && shouldMainContainerUpdate) ||
      !isMetaWidgetPresentInCurrentView ||
      isTemplateWidgetChanged ||
      (type === this.primaryWidgetType && templateWidgetsAddedOrRemoved) ||
      (type === this.primaryWidgetType && levelDataUpdated)
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
      nextOptions.itemGap !== this.itemGap ||
      nextOptions.pageNo !== this.pageNo ||
      nextOptions.pageSize !== this.pageSize ||
      nextOptions.primaryKeys !== this.primaryKeys ||
      nextOptions.serverSidePagination !== this.serverSidePagination ||
      nextOptions.templateBottomRow !== this.templateBottomRow
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

  private getRowTemplateCache = (key: string, templateWidgetId: string) => {
    return this.getRowCache(key)?.[templateWidgetId];
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

    // All the template widget names
    const templateWidgetNames = Object.keys(metaWidgetsMap);
    const dependantBinding: Record<string, string> = {};

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
          ${templateWidgetName}: {${dependantMetaWidget.entityDefinition}}
        `;
      }
    });

    return dependantBinding;
  };

  private getRowCacheGroupByTemplateWidgetName = (key: string) => {
    // Get all meta widgets for a key
    const metaWidgetsRowCache = this.getRowCache(key) || {};
    // For all the meta widgets, create a map between the template widget name and
    // the meta widget cache data

    return Object.values(metaWidgetsRowCache).reduce((acc, currMetaWidget) => {
      acc[currMetaWidget.templateWidgetName] = currMetaWidget;

      return acc;
    }, {} as Record<string, MetaWidgetCacheProps>);
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

  private getPrimaryKey = (rowIndex: number): string => {
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

  getCacheByMetaWidgetId = (metaWidgetId: string) => {
    const path = this.metaIdToCacheMap[metaWidgetId];

    return get(this.getCache(), path, {}) as MetaWidgetCacheProps;
  };

  private getCurrentRowMetaWidgets = (key: string) => {
    const templateWidgetIds = Object.keys(this.currTemplateWidgets || {});
    const metaWidgetsCache = this.getRowCache(key);

    const metaWidgets: MetaWidgetCacheProps[] = [];
    templateWidgetIds.forEach((templateWidgetId) => {
      if (metaWidgetsCache?.[templateWidgetId]) {
        metaWidgets.push(metaWidgetsCache?.[templateWidgetId]);
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
    return this.getRowTemplateCache(key, this.containerWidgetId)
      ?.metaWidgetName;
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
          const itemGap =
            listCount && ((listCount - 1) * this.itemGap) / listCount;
          return this.templateBottomRow * 10 + itemGap;
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
