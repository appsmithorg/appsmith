import { klona } from "klona";
import { difference, omit, set, get, isEmpty } from "lodash";

import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { extractTillNestedListWidget } from "./widget/helper";
import { FlattenedWidgetProps } from "widgets/constants";
import { generateReactKey } from "utils/generators";
import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import { ListWidgetProps } from "./constants";
import {
  DynamicPathMapList,
  DynamicPathType,
  LevelData,
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

type Options = {
  currTemplateWidgets: TemplateWidgets;
  prevTemplateWidgets?: TemplateWidgets;
  containerParentId: string;
  containerWidgetId: string;
  data: Record<string, unknown>[];
  dynamicPathMapList: DynamicPathMapList;
  gridGap: number;
  levelData?: LevelData;
  primaryKey: string;
  startIndex: number;
  widgetName: string;
};

type ConstructorProps = {
  isListCloned: boolean;
  level: number;
  renderMode: string;
  getWidgetCache: () => MetaWidgetCache | undefined;
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
  index: number;
  templateWidgetId: string;
  rowIndex: number;
  parentId: string;
};

type GenerateMetaWidgetChildrenProps = {
  index: number;
  parentId: string;
  templateWidget: FlattenedWidgetProps;
  rowIndex: number;
};

type GenerateMetaWidget = {
  metaWidgetId?: string;
  metaWidgetName?: string;
  childMetaWidgets?: MetaWidgets;
  metaWidget?: MetaWidget;
};

type LevelProperty = {
  currentIndex: number;
  currentItem: string;
  currentRow: Record<string, string>;
};

const ROOT_CONTAINER_PARENT_KEY = "__$ROOT_CONTAINER_PARENT$__";
const ROOT_ROW_KEY = "__$ROOT_KEY$__";
/**
 * LEVEL_PATH_REGEX gives out following matches:
 * Inputs
 * {{() => { level_1.currentIndex+ level_22.currentRow.something.test}()}}
 * {{level_1.currentIndex + level_1.currentRow.something.test}}
 * {{Text1.value}}
 *
 * Outputs
 * ["level_1.currentIndex", level_22.currentRow.something.test]
 * ["level_1.currentIndex", level_1.currentRow.something.test]
 * null
 */
// eslint-disable-next-line prettier/prettier
const LEVEL_PATH_REGEX = /level_[\$\w]*(\.[a-zA-Z\$\_][\$\w]*)*/gi;

class MetaWidgetGenerator {
  containerParentId: Options["containerParentId"];
  containerWidgetId: Options["containerWidgetId"];
  currViewMetaWidgetIds: string[];
  prevViewMetaWidgetIds: string[];
  currTemplateWidgets: TemplateWidgets;
  prevTemplateWidgets: TemplateWidgets;
  data: Options["data"];
  dynamicPathMapList: Options["dynamicPathMapList"];
  getWidgetCache: ConstructorProps["getWidgetCache"];
  setWidgetCache: ConstructorProps["setWidgetCache"];
  gridGap: Options["gridGap"];
  isListCloned: ConstructorProps["isListCloned"];
  level: ConstructorProps["level"];
  levelData: Options["levelData"];
  metaIdToCacheMap: Record<string, string>;
  primaryKey: Options["primaryKey"];
  renderMode: ConstructorProps["renderMode"];
  startIndex: Options["startIndex"];
  templateWidgetStatus: TemplateWidgetStatus;
  widgetId: ConstructorProps["widgetId"];
  widgetName: Options["widgetName"];

  constructor(props: ConstructorProps) {
    this.containerParentId = "";
    this.containerWidgetId = "";
    this.currViewMetaWidgetIds = [];
    this.prevViewMetaWidgetIds = [];
    this.dynamicPathMapList = {};
    this.data = [];
    this.gridGap = 0;
    this.isListCloned = props.isListCloned;
    this.level = props.level;
    this.levelData = undefined;
    this.getWidgetCache = props.getWidgetCache;
    this.setWidgetCache = props.setWidgetCache;
    this.metaIdToCacheMap = {};
    this.prevTemplateWidgets = {};
    this.primaryKey = "";
    this.renderMode = props.renderMode;
    this.startIndex = 0;
    this.templateWidgetStatus = {
      added: new Set(),
      updated: new Set(),
      removed: new Set(),
      unchanged: new Set(),
    };
    this.widgetName = "";
    this.widgetId = props.widgetId;
  }

  withOptions = (options: Options) => {
    this.containerParentId = options.containerParentId;
    this.containerWidgetId = options.containerWidgetId;
    this.data = options.data;
    this.dynamicPathMapList = options.dynamicPathMapList;
    this.gridGap = options.gridGap;
    this.levelData = options.levelData;
    this.primaryKey = options.primaryKey;
    this.startIndex = options.startIndex;
    this.widgetName = options.widgetName;
    this.currTemplateWidgets = extractTillNestedListWidget(
      options.currTemplateWidgets,
      options.containerParentId,
    );
    this.prevTemplateWidgets = extractTillNestedListWidget(
      options.prevTemplateWidgets,
      options.containerParentId,
    );
    return this;
  };

  generate = () => {
    const dataCount = this.data.length;
    const indices = Array.from(Array(dataCount).keys());
    let metaWidgets: MetaWidgets = {};

    // Reset
    this.currViewMetaWidgetIds = [];

    this.generateWidgetCacheForContainerParent();
    this.updateTemplateWidgetStatus();

    if (dataCount > 0) {
      indices.forEach((rowIndex) => {
        const index = this.startIndex + rowIndex;

        this.generateWidgetCacheData(index, rowIndex);

        const {
          childMetaWidgets,
          metaWidget,
        } = this.generateMetaWidgetRecursively({
          index,
          parentId: this.containerParentId,
          templateWidgetId: this.containerWidgetId,
          rowIndex,
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

    const removedMetaWidgetIds = difference(
      this.prevViewMetaWidgetIds,
      this.currViewMetaWidgetIds,
    );

    this.prevViewMetaWidgetIds = [...this.currViewMetaWidgetIds];

    return {
      metaWidgets,
      removedMetaWidgetIds,
    };
  };

  generateMetaWidgetRecursively = ({
    index,
    parentId,
    rowIndex,
    templateWidgetId,
  }: GenerateMetaWidgetProps): GenerateMetaWidget => {
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

    const {
      children,
      metaWidgets: childMetaWidgets,
    } = this.generateMetaWidgetChildren({
      index,
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
    } else {
      this.addDynamicPathsProperties(metaWidget, metaCacheProps);
    }

    if (templateWidget.type === "LIST_WIDGET_V2") {
      this.addLevelData(metaWidget, rowIndex);
    }

    if (this.isClonedRow(index)) {
      this.disableWidgetOperations(metaWidget);
    }

    metaWidget.currentIndex = index;
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

  generateMetaWidgetChildren = ({
    index,
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
        index,
        parentId,
        templateWidgetId: childWidgetId,
        rowIndex,
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

  generateWidgetCacheData = (index: number, rowIndex: number) => {
    const key = this.getPrimaryKey(rowIndex);
    const rowCache = this.getRowCache(key) || {};
    const isClonedRow = this.isClonedRow(index);
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
        index,
        metaWidgetId,
        metaWidgetName,
        rowIndex,
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

  generateWidgetCacheForContainerParent = () => {
    if (this.currTemplateWidgets && !isEmpty(this.currTemplateWidgets)) {
      const rowCache = this.getRowCache(ROOT_ROW_KEY) || {};
      const currentCache = rowCache[ROOT_CONTAINER_PARENT_KEY] || {};
      const updatedRowCache: MetaWidgetCache[string] = {};
      const {
        type,
        widgetName: containerParentName,
      } = this.currTemplateWidgets[this.containerParentId];

      const metaWidgetId = this.isListCloned
        ? currentCache.metaWidgetId || generateReactKey()
        : this.containerParentId;

      const metaWidgetName = this.isListCloned
        ? `${this.widgetName}_${containerParentName}_${metaWidgetId}`
        : containerParentName;

      updatedRowCache[ROOT_CONTAINER_PARENT_KEY] = {
        metaWidgetId,
        metaWidgetName,
        type,
        index: -1,
        rowIndex: -1,
        entityDefinition: {},
        templateWidgetId: this.containerParentId,
        templateWidgetName: containerParentName,
      };

      this.setRowCache(ROOT_ROW_KEY, {
        ...rowCache,
        ...updatedRowCache,
      });
    }
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

  addLevelData = (metaWidget: MetaWidget, index: number) => {
    const key = this.getPrimaryKey(index);
    const currentIndex = index;
    const currentItem = `{{${this.widgetName}.listData[${index}]}}`;
    const currentRowCache = this.getRowCacheByTemplateWidgetName(key);

    metaWidget.levelData = {
      ...this.levelData,
      [`level_${this.level}`]: {
        currentIndex,
        currentItem,
        currentRowCache,
      },
    };

    metaWidget.level = this.level + 1;
  };

  addDynamicPathsProperties = (
    metaWidget: MetaWidget,
    metaWidgetCacheProps: MetaWidgetCacheProps,
  ) => {
    const { metaWidgetName, rowIndex, templateWidgetId } = metaWidgetCacheProps;
    const key = this.getPrimaryKey(rowIndex);
    const dynamicMap = this.dynamicPathMapList[templateWidgetId];
    let referencesEntityDef: Record<string, string> = {};

    if (!dynamicMap) return;

    Object.entries(dynamicMap).forEach(([path, dynamicPathTypes]) => {
      const propertyValue: string = get(metaWidget, path);
      const { jsSnippets, stringSegments } = getDynamicBindings(propertyValue);
      const js = combineDynamicBindings(jsSnippets, stringSegments);
      const pathTypes = new Set();

      if (dynamicPathTypes.includes(DynamicPathType.CURRENT_ITEM)) {
        this.addCurrentItemProperty(metaWidget, metaWidgetName);
        pathTypes.add(DynamicPathType.CURRENT_ITEM);
      }

      if (dynamicPathTypes.includes(DynamicPathType.CURRENT_INDEX)) {
        pathTypes.add(DynamicPathType.CURRENT_INDEX);
      }

      if (dynamicPathTypes.includes(DynamicPathType.CURRENT_ROW)) {
        referencesEntityDef = {
          ...referencesEntityDef,
          ...this.getReferencesEntityDefMap(propertyValue, key),
        };
        pathTypes.add(DynamicPathType.CURRENT_ROW);
      }

      if (dynamicPathTypes.includes(DynamicPathType.LEVEL)) {
        pathTypes.add(DynamicPathType.CURRENT_ROW);
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

    this.addCurrentRowProperty(metaWidget, Object.values(referencesEntityDef));
  };

  addCurrentItemProperty = (metaWidget: MetaWidget, metaWidgetName: string) => {
    if (metaWidget.currentItem) return;

    metaWidget.currentItem = `{{${this.widgetName}.listData[${metaWidgetName}.currentIndex]}}`;
    metaWidget.dynamicBindingPathList = [
      ...(metaWidget.dynamicBindingPathList || []),
      { key: "currentItem" },
    ];
  };

  /**
   * This method adds a currentRow property to the meta widget.
   * The currentRow property has the corresponding row's widget's properties
   * based on the entity definition of that widget.
   * The way it is decided as to which meta widget's properties go in depends on the
   * widgets being referenced in the property value using the currentRow
   *
   * Ex - {{currentRow.Input1.value + currentRow.Input2.value}}
   * In this case Input1's properties and Input2's properties are part of currentRow
   *
   * The currentRow in this case can look like (2nd row of list)
   * currentRow = "{{
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
  addCurrentRowProperty = (metaWidget: MetaWidget, references: string[]) => {
    const currentRowBinding = Object.values(references).join(",");

    metaWidget.currentRow = `{{{${currentRowBinding}}}}`;
    metaWidget.dynamicBindingPathList = [
      ...(metaWidget.dynamicBindingPathList || []),
      { key: "currentRow" },
    ];
  };

  addLevelProperty = (metaWidget: MetaWidget, levelPaths: string[]) => {
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

      if (dynamicPathType === DynamicPathType.CURRENT_ROW) {
        const { entityDefinition } =
          lookupLevel?.currentRowCache?.[widgetName] || {};

        if (entityDefinition) {
          levelProps[level] = {
            ...(levelProps[level] || {}),
            currentRow: {
              ...(levelProps[level]?.currentRow || {}),
              [widgetName]: `{{{${entityDefinition}}}}`,
            },
          };

          dynamicBindingPathList.push(`${level}.currentRow.${widgetName}`);
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

  updateContainerBindings = (metaWidget: MetaWidget, key: string) => {
    const currentRowMetaWidgets = this.getCurrentRowMetaWidgets(key);
    const dataBinding = this.getContainerBinding(currentRowMetaWidgets);

    metaWidget.data = `{{${dataBinding}}}`;
    metaWidget.dynamicBindingPathList = [
      ...(metaWidget.dynamicBindingPathList || []),
      { key: "data" },
    ];
  };

  updateContainerPosition = (metaWidget: MetaWidget, index: number) => {
    const mainContainer = this.getContainerWidget();
    const gap = this.gridGap;

    metaWidget.gap = gap;
    metaWidget.topRow =
      index * mainContainer.bottomRow +
      index * (this.gridGap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
    metaWidget.bottomRow =
      (index + 1) * mainContainer.bottomRow +
      index * (this.gridGap / GridDefaults.DEFAULT_GRID_ROW_HEIGHT);
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
  updateTemplateWidgetStatus = () => {
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

  resetTemplateWidgetStatuses = () => {
    Object.values(this.templateWidgetStatus).forEach((status) => {
      status.clear();
    });
  };

  isClonedRow = (index: number) => {
    // TODO (ashit): Modify -> check if making the first row as template in view mode as well makes any difference?
    return (
      this.renderMode === RenderModes.PAGE ||
      (this.renderMode === RenderModes.CANVAS && index !== 0) ||
      this.isListCloned
    );
  };

  shouldGenerateMetaWidgetFor = (templateWidgetId: string, key: string) => {
    const { metaWidgetId } =
      this.getRowTemplateCache(key, templateWidgetId) || {};
    const { added, removed, unchanged } = this.templateWidgetStatus;
    const templateWidgetsAddedOrRemoved = added.size > 0 || removed.size > 0;
    const isMainContainerWidget = templateWidgetId === this.containerWidgetId;
    const isMetaWidgetPresentInCurrentView =
      metaWidgetId && this.prevViewMetaWidgetIds.includes(metaWidgetId);
    const isTemplateWidgetChanged = !unchanged.has(templateWidgetId);

    /**
     * true only when
     * if main container widget and any new children got added/removed then update
     * or
     * if non container widget - either it's property modified or doesn't exist in current view
     */

    return (
      (isMainContainerWidget && templateWidgetsAddedOrRemoved) ||
      !isMetaWidgetPresentInCurrentView ||
      isTemplateWidgetChanged
    );
  };

  setRowCache = (key: string, rowData: MetaWidgetCache[string]) => {
    const cache = this.getWidgetCache() || {};
    const updatedCache = {
      ...cache,
      [key]: rowData,
    };

    this.setWidgetCache(updatedCache);
  };

  getRowTemplateCache = (key: string, templateWidgetId: string) => {
    return this.getRowCache(key)?.[templateWidgetId];
  };

  getRowCache = (key: string) => {
    return this.getWidgetCache()?.[key];
  };

  getCache = () => {
    return this.getWidgetCache();
  };

  getContainerParentCache = () => {
    return this.getRowTemplateCache(ROOT_ROW_KEY, ROOT_CONTAINER_PARENT_KEY);
  };

  getReferencesEntityDefMap = (value: string, key: string) => {
    const metaWidgetsMap = this.getRowCacheByTemplateWidgetName(key);

    // All the template widget names
    const templateWidgetNames = Object.keys(metaWidgetsMap);
    const dependantBinding: Record<string, string> = {};

    /**
     * Loop through all the template widget names and check if the
     * property have uses any of the template widgets name
     * Eg -
     *  property value -> "{{currentRow.Input1.value}}"
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

  getRowCacheByTemplateWidgetName = (key: string) => {
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
    this.data.forEach((_datum, rowIndex) => {
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

  getContainerWidget = () =>
    this.currTemplateWidgets?.[this.containerWidgetId] as FlattenedWidgetProps;

  getPrimaryKey = (rowIndex: number) => {
    // TODO: Make sure a key is always returned from here, either a hash key
    // or user set.
    // Appropriate error cases needs to be handled.
    const data = this.data[rowIndex];
    return String(data[this.primaryKey]);
  };

  getPropsByMetaWidgetId = (metaWidgetId: string) => {
    const path = this.metaIdToCacheMap[metaWidgetId];

    return get(this.getCache(), path, {}) as MetaWidgetCacheProps;
  };

  getCurrentRowMetaWidgets = (key: string) => {
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

  getEntityDefinitionsFor = (widgetType: string) => {
    const config = get(entityDefinitions, widgetType);
    const entityDefinition = typeof config === "function" ? config({}) : config;

    return Object.keys(omit(entityDefinition, ["!doc", "!url"]));
  };

  getPropertiesOfWidget = (widgetName: string, type: string) => {
    const entityDefinitions = this.getEntityDefinitionsFor(type);

    return entityDefinitions
      .map((definition) => `${definition}: ${widgetName}.${definition}`)
      .join(",");
  };

  getContainerBinding = (metaWidgets: MetaWidgetCacheProps[]) => {
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
}

export default MetaWidgetGenerator;
