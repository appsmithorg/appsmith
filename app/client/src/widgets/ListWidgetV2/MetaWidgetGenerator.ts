import { klona } from "klona";
import { difference, omit, set, get, isEmpty } from "lodash";

import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { FlattenedWidgetProps } from "widgets/constants";
import { generateReactKey } from "utils/generators";
import { GridDefaults, RenderModes } from "constants/WidgetConstants";
import { ListWidgetProps } from "./constants";
import {
  DynamicPathMapList,
  DynamicPathType,
  MetaWidget,
  MetaWidgets,
} from "./widget";
import { WidgetProps } from "widgets/BaseWidget";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";

type FlattenedWidgets = ListWidgetProps<
  WidgetProps
>["flattenedChildCanvasWidgets"];

type Options = {
  data: Record<string, unknown>[];
  currFlattenedWidgets: FlattenedWidgets;
  prevFlattenedWidgets?: FlattenedWidgets;
  gridGap: number;
  containerWidgetId: string;
  containerParentId: string;
  primaryKey: string;
  startIndex: number;
  widgetName: string;
  pathsWithCurrentRow: Record<string, string[] | undefined>;
  dynamicPathMapList: DynamicPathMapList;
};

type ConstructorProps = {
  renderMode: string;
};

type MetaWidgetCacheProps = {
  entityDefinition: Record<string, string>;
  index: number;
  metaWidgetId: string;
  metaWidgetName: string;
  rowIndex: number;
  templateWidgetId: string;
  templateWidgetName: string;
  type: string;
};

type MetaWidgetCache = {
  [key: string]: Record<string, MetaWidgetCacheProps> | undefined;
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

type generateMetaWidgetReturn = {
  metaWidgetId?: string;
  metaWidgetName?: string;
  childMetaWidgets?: MetaWidgets;
  metaWidget?: MetaWidget;
};

class MetaWidgetGenerator {
  containerParentId: Options["containerParentId"];
  containerWidgetId: Options["containerWidgetId"];
  currViewMetaWidgetIds: string[];
  prevViewMetaWidgetIds: string[];
  currFlattenedWidgets: FlattenedWidgets;
  prevFlattenedWidgets: FlattenedWidgets;
  dynamicPathMapList: Options["dynamicPathMapList"];
  data: Options["data"];
  gridGap: Options["gridGap"];
  metaIdToCacheMap: Record<string, string>;
  metaWidgetCache: MetaWidgetCache;
  primaryKey: Options["primaryKey"];
  renderMode: ConstructorProps["renderMode"];
  startIndex: Options["startIndex"];
  templateWidgetStatus: TemplateWidgetStatus;
  widgetName: Options["widgetName"];

  constructor(props: ConstructorProps) {
    this.containerParentId = "";
    this.containerWidgetId = "";
    this.currViewMetaWidgetIds = [];
    this.prevViewMetaWidgetIds = [];
    this.dynamicPathMapList = {};
    this.data = [];
    this.gridGap = 0;
    this.metaWidgetCache = {};
    this.prevFlattenedWidgets = {};
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
    this.metaIdToCacheMap = {};
  }

  withOptions = (options: Options) => {
    this.containerParentId = options.containerParentId;
    this.containerWidgetId = options.containerWidgetId;
    this.currFlattenedWidgets = options.currFlattenedWidgets || {};
    this.prevFlattenedWidgets = options.prevFlattenedWidgets;
    this.data = options.data;
    this.dynamicPathMapList = options.dynamicPathMapList;
    this.gridGap = options.gridGap;
    this.primaryKey = options.primaryKey;
    this.startIndex = options.startIndex;
    this.widgetName = options.widgetName;
    return this;
  };

  generate = () => {
    const dataCount = this.data.length;
    const indices = Array.from(Array(dataCount).keys());
    let metaWidgets: MetaWidgets = {};

    // Reset
    this.currViewMetaWidgetIds = [];

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
  }: GenerateMetaWidgetProps): generateMetaWidgetReturn => {
    const templateWidget = this.currFlattenedWidgets?.[templateWidgetId];

    if (!templateWidget) return { metaWidgetId: "", metaWidgetName: "" };

    const key = this.getPrimaryKey(rowIndex);
    const metaWidget = klona(templateWidget) as MetaWidget;
    const metaCacheProps = this.getCachedMetaWidgetProps(key, templateWidgetId);

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

    if (this.isClonedRow(index)) {
      this.disableWidgetOperations(metaWidget);
    }

    metaWidget.currentIndex = index;
    metaWidget.widgetId = metaWidgetId;
    metaWidget.widgetName = metaWidgetName;
    metaWidget.children = children;
    metaWidget.parentId = parentId;

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

    (templateWidget.children || []).map((childWidgetId: string) => {
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
    const cache = this.metaWidgetCache[key] || {};
    const isClonedRow = this.isClonedRow(index);
    const templateWidgets =
      Object.values(this.currFlattenedWidgets || {}) || [];

    templateWidgets.forEach((templateWidget) => {
      const {
        type,
        widgetId: templateWidgetId,
        widgetName: templateWidgetName,
      } = templateWidget;

      if (templateWidgetId === this.containerParentId) return;

      const currentCache = cache[templateWidgetId] || {};
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

      this.metaWidgetCache[key] = {
        ...this.metaWidgetCache[key],
        [templateWidgetId]: {
          entityDefinition,
          index,
          metaWidgetId,
          metaWidgetName,
          rowIndex,
          templateWidgetId,
          templateWidgetName,
          type,
        },
      };
    });
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
      const propertyValue = get(metaWidget, path);
      const { jsSnippets, stringSegments } = getDynamicBindings(propertyValue);
      const js = combineDynamicBindings(jsSnippets, stringSegments);

      if (dynamicPathTypes.includes(DynamicPathType.CURRENT_ITEM)) {
        this.addCurrentItemProperty(metaWidget, metaWidgetName);
      }

      if (dynamicPathTypes.includes(DynamicPathType.CURRENT_ROW)) {
        referencesEntityDef = {
          ...referencesEntityDef,
          ...this.getReferencesEntityDefMap(propertyValue, key),
        };
      }

      const prefix = dynamicPathTypes.join(", ");
      const suffix = dynamicPathTypes
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
      { key: "currentIndex" },
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
    const mainContainer = this.getMainWidget();
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
    const newWidgetIds = Object.keys(this.currFlattenedWidgets || {});
    const prevWidgetIds = Object.keys(this.prevFlattenedWidgets || {});

    this.templateWidgetStatus.added.clear();
    this.templateWidgetStatus.removed.clear();
    this.templateWidgetStatus.unchanged.clear();
    this.templateWidgetStatus.updated.clear();

    const addedIds = difference(newWidgetIds, prevWidgetIds);
    const removedIds = difference(prevWidgetIds, newWidgetIds);
    const updatedIds = difference(newWidgetIds, addedIds);

    addedIds.forEach((addedId) => this.templateWidgetStatus.added.add(addedId));

    removedIds.forEach((removedId) =>
      this.templateWidgetStatus.removed.add(removedId),
    );

    updatedIds.forEach((updatedId) => {
      const isEqual =
        this.prevFlattenedWidgets?.[updatedId] ===
        this.currFlattenedWidgets?.[updatedId];

      if (isEqual) {
        this.templateWidgetStatus.unchanged.add(updatedId);
      } else {
        this.templateWidgetStatus.updated.add(updatedId);
      }
    });
  };

  isClonedRow = (index: number) => {
    return (
      this.renderMode === RenderModes.PAGE ||
      (this.renderMode === RenderModes.CANVAS && index !== 0)
    );
  };

  shouldGenerateMetaWidgetFor = (templateWidgetId: string, key: string) => {
    const { metaWidgetId } =
      this.getCachedMetaWidgetProps(key, templateWidgetId) || {};
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

  getReferencesEntityDefMap = (value: string, key: string) => {
    // Get all meta widgets for a key
    const metaWidgetsCacheProps = this.metaWidgetCache[key] || {};
    // For all the meta widgets, create a map between the template widget name and
    // the meta widget cache data
    const metaWidgetsMap = Object.values(metaWidgetsCacheProps).reduce(
      (acc, currMetaWidget) => {
        acc[currMetaWidget.templateWidgetName] = currMetaWidget;

        return acc;
      },
      {} as Record<string, MetaWidgetCacheProps>,
    );

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

  getMetaContainers = () => {
    const containers = { ids: [] as string[], names: [] as string[] };
    this.data.forEach((_datum, rowIndex) => {
      const key = this.getPrimaryKey(rowIndex);
      const metaContainer = this.metaWidgetCache[key]?.[this.containerWidgetId];
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

  getMainWidget = () =>
    this.currFlattenedWidgets?.[this.containerWidgetId] as FlattenedWidgetProps;

  getPrimaryKey = (rowIndex: number) => {
    // TODO: Make sure a key is always returned from here, either a hash key
    // or user set.
    // Appropriate error cases needs to be handled.
    const data = this.data[rowIndex];
    return String(data[this.primaryKey]);
  };

  getPropsByMetaWidgetId = (metaWidgetId: string) => {
    const path = this.metaIdToCacheMap[metaWidgetId];

    return get(this.metaWidgetCache, path, {}) as MetaWidgetCacheProps;
  };

  getCachedMetaWidgetProps = (key: string, templateWidgetId: string) => {
    return this.metaWidgetCache?.[key]?.[templateWidgetId];
  };

  getCurrentRowMetaWidgets = (key: string) => {
    const templateWidgetIds = Object.keys(this.currFlattenedWidgets || {});
    const metaWidgetsCache = this.metaWidgetCache[key];

    const metaWidgets: MetaWidgetCacheProps[] = [];
    templateWidgetIds.forEach((templateWidgetId) => {
      if (metaWidgetsCache?.[templateWidgetId]) {
        metaWidgets.push(metaWidgetsCache?.[templateWidgetId]);
      }
    });

    return metaWidgets;
  };

  getEntityDefinitionsFor = (widgetType: string) => {
    return Object.keys(
      omit(get(entityDefinitions, widgetType), ["!doc", "!url"]),
    );
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
