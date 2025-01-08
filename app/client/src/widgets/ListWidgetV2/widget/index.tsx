import isEqual from "fast-deep-equal/es6";
import log from "loglevel";
import memoize from "micro-memoize";
import type { RefObject } from "react";
import React, { createRef } from "react";
import { floor, isEmpty, isNil, isString } from "lodash";
import hash from "object-hash";
import type { WidgetOperation, WidgetProps } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import derivedProperties from "./parseDerivedProperties";
import ListComponent, { ListComponentEmpty } from "../component";
import ListPagination, {
  ServerSideListPagination,
} from "../component/ListPagination";
import Loader from "../component/Loader";
import MetaWidgetContextProvider from "../../MetaWidgetContextProvider";
import type { GeneratorOptions, HookOptions } from "../MetaWidgetGenerator";
import MetaWidgetGenerator from "../MetaWidgetGenerator";
import type { BatchPropertyUpdatePayload } from "actions/controlActions";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
  CanvasWidgetStructure,
  FlattenedWidgetProps,
  PropertyUpdates,
  SnipingModeProperty,
} from "WidgetProvider/constants";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import {
  PropertyPaneContentConfig,
  PropertyPaneStyleConfig,
} from "./propertyConfig";
import {
  RenderModes,
  WIDGET_PADDING,
  WIDGET_TAGS,
} from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ModifyMetaWidgetPayload } from "reducers/entityReducers/metaWidgetsReducer.types";
import type { WidgetState } from "../../BaseWidget";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import type {
  TabContainerWidgetProps,
  TabsWidgetProps,
} from "widgets/TabsWidget/constants";
import { getMetaFlexLayers, isTargetElementClickable } from "./helper";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type { ExtraDef } from "utils/autocomplete/defCreatorUtils";
import { LayoutSystemTypes } from "layoutSystems/types";
import { generateTypeDef } from "utils/autocomplete/defCreatorUtils";
import defaultProps from "./defaultProps";

import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { renderAppsmithCanvas } from "layoutSystems/CanvasFactory";
import { klonaRegularWithTelemetry } from "utils/helpers";

const getCurrentItemsViewBindingTemplate = () => ({
  prefix: "{{[",
  suffix: "]}}",
});

export const DEFAULT_TEMPLATE_HEIGHT = 100;

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

export interface LevelData {
  [level: string]: {
    currentIndex: number;
    currentItem: string;
    currentRowCache: LevelDataRowCache;
    autocomplete: Record<string, unknown>;
  };
}

export interface MetaWidgetCacheProps {
  entityDefinition: string;
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
  prevViewIndex?: number;
}

type LevelDataMetaWidgetCacheProps = Omit<
  MetaWidgetCacheProps,
  "originalMetaWidgetId" | "originalMetaWidgetName"
>;

export type MetaWidgetRowCache = Record<string, MetaWidgetCacheProps>;

type LevelDataRowCache = Record<string, LevelDataMetaWidgetCacheProps>;

export interface MetaWidgetCache {
  [key: string]: MetaWidgetRowCache | undefined;
}

type ExtendedCanvasWidgetStructure = CanvasWidgetStructure & {
  canExtend?: boolean;
  shouldScrollContents?: boolean;
  isListWidgetCanvas?: boolean;
};

interface RenderChildrenOption {
  componentWidth: number;
  parentColumnSpace: number;
  selectedItemKey?: string | null;
  startIndex: number;
}

const LIST_WIDGET_PAGINATION_HEIGHT = 36;
const EMPTY_BINDING = "{{{}}}";

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
  pageChangeEventTriggerFromPageNo?: number | null;
  pageChangeEventTriggerFromSelectedKey: boolean;
  pageSizeUpdated: boolean;
  primaryKeys: string[];

  static type = "LIST_WIDGET_V2";

  static getConfig() {
    return {
      name: "List",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.DISPLAY],
      needsMeta: true,
      isCanvas: true,
    };
  }

  static getDefaults() {
    return defaultProps;
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "listData",
            propertyValue: propValueMap.data,
            isDynamicPropertyPath: true,
          },
        ];
      },
      getOneClickBindingConnectableWidgetConfig: (widget: WidgetProps) => {
        return {
          widgetBindPath: `${widget.widgetName}.selectedItem`,
          message: `Make sure ${widget.widgetName} data matches the column names in the connected datasource and has a default selected item`,
        };
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "280px",
              minHeight: "300px",
            };
          },
        },
      ],
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "300px" },
        minWidth: { base: "280px" },
      },
    };
  }

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

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return (widget: ListWidgetProps, extraDefsToDefine?: ExtraDef) => {
      const obj = {
        "!doc":
          "Containers are used to group widgets together to form logical higher order widgets. Containers let you organize your page better and move all the widgets inside them together.",
        "!url": "https://docs.appsmith.com/widget-reference/list",
        backgroundColor: {
          "!type": "string",
          "!url":
            "https://docs.appsmith.com/widget-reference/how-to-use-widgets",
        },
        isVisible: DefaultAutocompleteDefinitions.isVisible,
        itemSpacing: "number",
        selectedItem: generateTypeDef(widget.selectedItem, extraDefsToDefine),
        selectedItemView: generateTypeDef(
          widget.selectedItemView,
          extraDefsToDefine,
        ),
        triggeredItem: generateTypeDef(widget.triggeredItem, extraDefsToDefine),
        triggeredItemView: generateTypeDef(
          widget.triggeredItemView,
          extraDefsToDefine,
        ),
        listData: generateTypeDef(widget.listData, extraDefsToDefine),
        pageNo: generateTypeDef(widget.pageNo),
        pageSize: generateTypeDef(widget.pageSize),
        currentItemsView: generateTypeDef(
          widget.currentItemsView,
          extraDefsToDefine,
        ),
      };

      return obj;
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
      },
    };
  }

  static getDerivedPropertiesMap() {
    return {
      childAutoComplete: `{{(() => {${derivedProperties.getChildAutoComplete}})()}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedItemKey: "defaultSelectedItem",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      pageNo: 1,
      currentItemsView: "{{[]}}",
      selectedItemView: "{{{}}}",
      triggeredItemView: "{{{}}}",
      selectedItem: undefined,
      triggeredItem: undefined,
      selectedItemKey: undefined,
      triggeredItemKey: undefined,
    };
  }

  constructor(props: ListWidgetProps | Readonly<ListWidgetProps>) {
    super(props);
    const { referencedWidgetId, widgetId } = props;
    const isListCloned =
      Boolean(referencedWidgetId) && referencedWidgetId !== widgetId;

    this.metaWidgetGenerator = new MetaWidgetGenerator({
      getWidgetCache: this.getWidgetCache,
      getWidgetReferenceCache: this.getWidgetReferenceCache,
      infiniteScroll: props.infiniteScroll ?? false,
      isListCloned,
      level: props.level || 1,
      onVirtualListScroll: this.generateMetaWidgets,
      prefixMetaWidgetId: props.prefixMetaWidgetId || props.widgetId,
      primaryWidgetType: ListWidget.type,
      renderMode: props.renderMode,
      setWidgetCache: this.setWidgetCache,
      setWidgetReferenceCache: this.setWidgetReferenceCache,
    });
    this.prevMetaContainerNames = [];
    this.componentRef = createRef<HTMLDivElement>();
    this.pageSize = this.getPageSize();
    this.primaryKeys = this.generatePrimaryKeys();
    this.pageChangeEventTriggerFromSelectedKey = false;
    /**
     * To prevent an infinite loop, we use a flag to avoid recursively updating the pageSize property.
     * This is necessary because the updateWidgetProperty function does not immediately update the property,
     * and calling componentDidUpdate can trigger another update, causing an endless loop.
     * By using this flag, we can prevent unnecessary and incessant invocations of the updatePageSize function.
     */
    this.pageSizeUpdated = false;
  }

  componentDidMount() {
    this.pageSize = this.getPageSize();
    this.primaryKeys = this.generatePrimaryKeys();

    if (this.props.pageSize === this.pageSize) {
      this.pageSizeUpdated = true;
    }

    if (this.shouldUpdatePageSize() && !this.pageSizeUpdated) {
      this.updatePageSize();
    }

    if (
      isString(this.props.selectedItemKey) ||
      isString(this.props.triggeredItemKey)
    ) {
      /**
       * Resetting selected Items and triggered items when the list widget is mounted
       * because the MetaWidgetGenerator also clears all cached data when mounted or re-mounted
       * in both client and server-side. Although it recoverable in client side pagination.
       *
       * Task: Persist the cache in List V2.1
       * The current issue exist is two forms
       * 1. When we move from canvas to the query page, the widgetCache is lost since BaseWidget is unmounted  and we lose all cache
       * once we navigate back to the canvas the List widget generates new sets of metaWidget with different
       * widgetIds and name.
       * 2. A nested List widget, when the parent widget switches pages, the inner List is unmounted.
       */

      if (this.props.serverSidePagination) {
        this.resetCache();
      } else {
        this.resetTriggeredCache();
      }
    }

    if (
      isString(this.props.selectedItemKey) &&
      this.primaryKeys &&
      !this.props.serverSidePagination
    ) {
      // Go to the page containing the defaultKey/SelectedKey when the List widget is mounted
      // We'd update the SelectedItemView when we're on that page.
      const rowIndex = this.getRowIndexOfSelectedItem(
        this.props.selectedItemKey,
      );

      if (rowIndex !== -1) {
        this.updatePageNumber(this.props.selectedItemKey);
        this.updateSelectedItem(rowIndex);
        this.pageChangeEventTriggerFromSelectedKey = true;
      }
    }

    if (
      this.props.defaultSelectedItem &&
      !isString(this.props.selectedItemKey) &&
      !this.props.serverSidePagination
    ) {
      // There are some mounting cases where the defaultSelectedItem isn't mapped with selectedItemKey
      const defaultKey = String(this.props.defaultSelectedItem);

      this.props.updateWidgetMetaProperty("selectedItemKey", defaultKey);
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

    if (!isEqual(this.props.primaryKeys, prevProps.primaryKeys)) {
      this.primaryKeys = this.generatePrimaryKeys();
    }

    if (this.shouldUpdatePageSize() && this.pageSizeUpdated) {
      this.updatePageSize();
      this.pageSizeUpdated = false;

      if (this.props.serverSidePagination && this.pageSize) {
        this.executeOnPageChange();
      }
    }

    if (this.props.pageSize === this.pageSize) {
      this.pageSizeUpdated = true;
    }

    if (this.serverPaginationJustEnabled(prevProps)) {
      // reset pageNo when serverSide Pagination is just turned on
      this.onPageChange(1);
    }

    if (this.isCurrPageNoGreaterThanMaxPageNo()) {
      const totalRecords = this.getTotalDataCount();

      const maxPageNo = Math.max(Math.ceil(totalRecords / this.pageSize), 1);

      this.onPageChange(maxPageNo);
    }

    if (this.hasPageNoReset(prevProps.pageNo, this.props.pageNo)) {
      this.executeOnPageChange();

      // Reset
      this.pageChangeEventTriggerFromPageNo = null;
    }

    if (this.shouldUpdateCacheKeys(prevProps)) {
      this.handleRowCacheData();
    }

    this.setupMetaWidgets(prevProps);

    if (
      this.didDefaultSelectedItemChange(prevProps) ||
      this.props.primaryKeys !== prevProps.primaryKeys
    ) {
      /**
       * If there's a change in the defaultSelectedItem, we'd either update the selectedItem, ItemView and PageNumber if the key is present
       * else we reset the Selections, since the new SelectedKey isn't present in the primaryKeys.
       */
      this.handleDefaultSelectedItemChange();
    }

    /**
     * NB: This is to come after setupMetaWidgets as SelectedItemView is dependent on the meta widget container name.
     *
     * We'd need to update PageNumber, SelectedItem and SelectedItemView if
     * 1. When the List widget is resetted.
     * 2. DefaultSelectedItem is set when the component is mounted (Primarily to update updateSelectedItemView)
     *
     */
    if (
      this.shouldUpdateSelectedItemAndView() &&
      isString(this.props.selectedItemKey)
    ) {
      this.updateSelectedItemAndPageOnResetOrMount();
    }
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
      level: this.props.level ?? 1,
      levelData: this.props.levelData,
      nestedViewIndex: this.props.nestedViewIndex,
      prevTemplateWidgets: this.prevFlattenedChildCanvasWidgets,
      primaryKeys: this.primaryKeys,
      scrollElement: this.componentRef.current,
      templateHeight: this.getTemplateHeight(),
      widgetName: this.props.widgetName,
      pageNo,
      pageSize,
      serverSidePagination,
      hooks: {
        afterMetaWidgetGenerate: this.afterMetaWidgetGenerate,
      },
    };
  };

  generatePrimaryKeys = () => {
    const { listData, primaryKeys } = this.props;

    if (!listData) return [];

    return listData.map((datum, index) => {
      const key = primaryKeys?.[index];

      if (typeof key === "number" || typeof key === "string") {
        return key.toString();
      }

      const datumToHash = datum ?? index;

      return hash(datumToHash, { algorithm: "md5" });
    });
  };

  generateMetaWidgets = () => {
    const generatorOptions = this.metaWidgetGeneratorOptions();

    const { metaWidgets, propertyUpdates, removedMetaWidgetIds } =
      this.metaWidgetGenerator.withOptions(generatorOptions).generate();

    this.updateCurrentItemsViewBinding();
    const mainCanvasWidget = this.generateMainMetaCanvasWidget();

    this.syncMetaContainerNames();

    const updates: ModifyMetaWidgetPayload = {
      addOrUpdate: metaWidgets,
      deleteIds: removedMetaWidgetIds,
      propertyUpdates,
    };

    /**
     * The else if condition checks if the List's canvas widget is present in the
     * metaWidgetChildrenStructure, if not then it tries to re-hydrate it with the
     * previously generated mainCanvasWidget.
     *
     * This handles a case where the inner List widget is dragged an dropped outside
     * the list widget and into the main canvas. This operation results into the calling
     * of componentWillUnmount after componentDidMount of the inner list widget and the
     * main canvas gets removed thus breaking the sub-tree. This needs to be further
     * explored as to why this happen but for the time being this patch fixes that issue.
     */
    if (mainCanvasWidget) {
      metaWidgets[mainCanvasWidget.widgetId] = mainCanvasWidget;
    } else if (
      (this.props.metaWidgetChildrenStructure || []).length === 0 &&
      this.prevMetaMainCanvasWidget
    ) {
      metaWidgets[this.prevMetaMainCanvasWidget.widgetId] =
        this.prevMetaMainCanvasWidget;
    }

    const { metaWidgetId: metaMainCanvasId } =
      this.metaWidgetGenerator.getContainerParentCache() || {};

    if (
      this.props.isMetaWidget &&
      metaMainCanvasId !== this.props.metaWidgetChildrenStructure?.[0]?.widgetId
    ) {
      // Inner list widget's cloned row's main canvas widget
      // will have a new widgetId as it has to be different from the
      // main template  canvas widgetId. This new widgetId has to be
      // updated as the "children" of the inner List widget.
      updates.propertyUpdates = [
        ...propertyUpdates,
        {
          path: `${this.props.widgetId}.children`,
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
    const { ids: currMetaContainerIds } =
      this.metaWidgetGenerator.getMetaContainers();

    const mainCanvasWidget = this.mainMetaCanvasWidget();

    if (mainCanvasWidget) {
      mainCanvasWidget.children = currMetaContainerIds;
    }

    if (!isEqual(this.prevMetaMainCanvasWidget, mainCanvasWidget)) {
      this.prevMetaMainCanvasWidget = klonaRegularWithTelemetry(
        mainCanvasWidget,
        "ListWidgetV2.generateMainMetaCanvasWidget",
      );

      return mainCanvasWidget;
    }
  };

  afterMetaWidgetGenerate = (metaWidget: MetaWidget, options: HookOptions) => {
    if (metaWidget.type === "TABS_WIDGET") {
      const tabsWidget = metaWidget as MetaWidget<
        TabsWidgetProps<TabContainerWidgetProps>
      >;

      Object.values(tabsWidget.tabsObj).forEach((tab) => {
        tab.widgetId = options.rowReferences[tab.widgetId] || tab.widgetId;
      });
    }

    //To Add auto-layout flex layer for meta Canvas Widgets
    if (metaWidget.type === "CANVAS_WIDGET" && metaWidget.flexLayers) {
      metaWidget.flexLayers = getMetaFlexLayers(
        metaWidget.flexLayers,
        options.rowReferences,
      );
    }

    if (metaWidget.dynamicHeight === "AUTO_HEIGHT") {
      metaWidget.dynamicHeight = "FIXED";
    }
  };

  updateCurrentItemsViewBinding = () => {
    const { names: currMetaContainerNames } =
      this.metaWidgetGenerator.getMetaContainers();

    const { prefix, suffix } = getCurrentItemsViewBindingTemplate();

    if (!isEqual(this.prevMetaContainerNames, currMetaContainerNames)) {
      const currentItemsViewBinding = `${prefix}${currMetaContainerNames.map(
        (name) => `${name}.data`,
      )}${suffix}`;

      this.props.updateWidgetMetaProperty(
        "currentItemsView",
        currentItemsViewBinding,
      );
    }
  };

  syncMetaContainerNames = () => {
    const { names: currMetaContainerNames } =
      this.metaWidgetGenerator.getMetaContainers();

    this.prevMetaContainerNames = [...currMetaContainerNames];
  };

  getMainContainer = () => {
    const { flattenedChildCanvasWidgets, mainContainerId = "" } = this.props;

    return flattenedChildCanvasWidgets?.[mainContainerId];
  };

  getTemplateHeight = () => {
    return this.getMainContainer()?.componentHeight || DEFAULT_TEMPLATE_HEIGHT;
  };

  getContainerRowHeight = () => {
    const { itemSpacing = 0, listData } = this.props;
    const containerVerticalPadding = WIDGET_PADDING * 2;
    const itemsCount = (listData || []).length;
    const templateHeight = this.getTemplateHeight();

    const averageItemSpacing = itemsCount
      ? (itemSpacing - containerVerticalPadding) *
        ((itemsCount - 1) / itemsCount)
      : 0;

    return templateHeight + averageItemSpacing;
  };

  getPageSize = () => {
    const { infiniteScroll, listData, serverSidePagination } = this.props;
    const spaceTakenByOneContainer = this.getContainerRowHeight();

    const itemsCount = (listData || []).length;

    const { componentHeight } = this.props;

    const spaceAvailableWithoutPaginationControls =
      componentHeight - WIDGET_PADDING * 2;
    const spaceAvailableWithPaginationControls =
      spaceAvailableWithoutPaginationControls - LIST_WIDGET_PAGINATION_HEIGHT;

    const spaceTakenByAllContainers = spaceTakenByOneContainer * itemsCount;
    const exceedsAvailableSpace =
      spaceTakenByAllContainers > spaceAvailableWithoutPaginationControls;
    const paginationControlsEnabled =
      spaceTakenByAllContainers > 0 &&
      (exceedsAvailableSpace || serverSidePagination) &&
      !infiniteScroll;

    const totalAvailableSpace = paginationControlsEnabled
      ? spaceAvailableWithPaginationControls
      : spaceAvailableWithoutPaginationControls;

    const pageSize = totalAvailableSpace / spaceTakenByOneContainer;

    return isNaN(pageSize) ? 0 : floor(pageSize);
  };

  /**
   * If this object has some value then the onPageChange event was triggered
   * and the prev and curr properties in it represent what was the transition
   * when the event was triggered.
   * This helps in ensuring that during a page change onPageChange event was
   * successfully triggered.
   *
   * Page no can be changed in 2 ways
   * 1. On clicking of page number in the pagination controls
   * 2. The widget is reset and the page no resets to 1.
   * 3. If current page is higher than the max page available.
   *  */
  hasPageNoReset = (prevPageNo: number, currPageNo: number) => {
    return (
      prevPageNo > 1 &&
      currPageNo === 1 &&
      (!this.pageChangeEventTriggerFromPageNo ||
        this.pageChangeEventTriggerFromPageNo !== prevPageNo)
    );
  };

  updatePageSize = () => {
    super.updateWidgetProperty("pageSize", this.pageSize);
  };

  // This is only for client-side data
  updatePageNumber = (key: string) => {
    if (this.props.serverSidePagination) return;

    const rowIndex = this.getRowIndexOfSelectedItem(key);

    if (rowIndex === -1) return;

    const pageNo = this.calculatePageNumberFromRowIndex(rowIndex);

    this.onPageChange(pageNo);
  };

  shouldUpdateSelectedItemAndView = () => {
    const { serverSidePagination } = this.props;

    return Boolean(
      !serverSidePagination &&
        isString(this.props.selectedItemKey) &&
        (!this.props.selectedItem ||
          this.props.selectedItemView === EMPTY_BINDING ||
          this.pageChangeEventTriggerFromSelectedKey),
    );
  };

  updateSelectedItemAndPageOnResetOrMount = () => {
    const selectedItemKey = String(this.props.selectedItemKey);
    const rowIndex = this.getRowIndexOfSelectedItem(selectedItemKey);
    const binding = this.getItemViewBindingByRowIndex(rowIndex);

    if (this.pageChangeEventTriggerFromSelectedKey && rowIndex !== -1) {
      this.updateSelectedItemView(rowIndex);
      this.pageChangeEventTriggerFromSelectedKey = false;

      return;
    }

    if (rowIndex !== -1) {
      this.updatePageNumber(selectedItemKey);
      this.updateSelectedItem(rowIndex);

      if (binding !== EMPTY_BINDING) {
        this.pageChangeEventTriggerFromSelectedKey = true;
      } else {
        this.updateSelectedItemView(rowIndex);
      }
    }
  };

  /**
   *
   * This is to check if the defaultSelectedItem has changed.
   * If the defaultSelectedItem changes, the selectedItemKey would change and the selectedItem would
   * remain the same.
   */
  didDefaultSelectedItemChange = (prevProps: ListWidgetProps) =>
    Boolean(
      this.props.selectedItemKey !== prevProps.selectedItemKey &&
        isEqual(this.props.selectedItem, prevProps.selectedItem),
    );

  handleDefaultSelectedItemChange = () => {
    if (this.props.serverSidePagination) return;

    const selectedItemKey = String(this.props.selectedItemKey);
    const rowIndex = this.getRowIndexOfSelectedItem(selectedItemKey);

    if (rowIndex !== -1) {
      this.updatePageNumber(selectedItemKey);
      this.updateSelectedItem(rowIndex);
      const binding = this.getItemViewBindingByRowIndex(rowIndex);

      if (binding === EMPTY_BINDING) {
        this.pageChangeEventTriggerFromSelectedKey = true;
      } else {
        this.updateSelectedItemView(rowIndex);
      }
    } else {
      this.resetSelectedItemView();
      this.resetSelectedItem();
    }
  };

  getRowIndexOfSelectedItem = (selectedItemKey: string) => {
    if (!this.primaryKeys || isNil(selectedItemKey)) return -1;

    const rowIndex = this.primaryKeys.indexOf(selectedItemKey.toString());

    return rowIndex;
  };

  calculatePageNumberFromRowIndex = (index: number) => {
    return Math.ceil((index + 1) / this.pageSize);
  };

  shouldUpdatePageSize = () => {
    return this.props.listData?.length && this.props.pageSize !== this.pageSize;
  };

  isCurrPageNoGreaterThanMaxPageNo = () => {
    const totalRecords = this.getTotalDataCount();

    if (totalRecords && !this.props.infiniteScroll) {
      const maxPageNo = Math.ceil(totalRecords / this.pageSize);

      return maxPageNo < this.props.pageNo;
    }

    return false;
  };

  mainMetaCanvasWidget = () => {
    const { flattenedChildCanvasWidgets = {}, mainCanvasId = "" } = this.props;
    const mainCanvasWidget = flattenedChildCanvasWidgets[mainCanvasId] || {};
    const { componentHeight, componentWidth } = this.props;

    const metaMainCanvas =
      klonaRegularWithTelemetry(
        mainCanvasWidget,
        "ListWidget.mainMetaCanvasWidget",
      ) ?? {};

    const { metaWidgetId, metaWidgetName } =
      this.metaWidgetGenerator.getContainerParentCache() || {};

    if (!metaWidgetId || !metaWidgetName) return;

    metaMainCanvas.parentId = this.props.widgetId;
    metaMainCanvas.widgetId = metaWidgetId;
    metaMainCanvas.widgetName = metaWidgetName;
    metaMainCanvas.canExtend = true;
    metaMainCanvas.minHeight = componentHeight;
    metaMainCanvas.rightColumn = componentWidth;
    metaMainCanvas.noPad = true;
    metaMainCanvas.bottomRow = this.mainMetaCanvasWidgetBottomRow();

    return metaMainCanvas as MetaWidget;
  };

  mainMetaCanvasWidgetBottomRow = () => {
    const { componentHeight } = this.props;

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

      this.pageChangeEventTriggerFromPageNo = currentPage;
    } else {
      this.props.updateWidgetMetaProperty("pageNo", page);
    }
  };

  executeOnPageChange = () => {
    super.executeAction({
      triggerPropertyName: "onPageChange",
      dynamicString: this.props.onPageChange,
      event: {
        type: EventType.ON_PAGE_SIZE_CHANGE,
      },
    });
  };

  /**
   * Only Initiate Cache if
   * 1. Triggered or Selected Key changes (i.e a  new row was triggered or selected)
   * 2. If Server-side Pagination is just turned on. (This is mainly to cache any row previously selected)
   * 3. When we have a defaultSelectedItem
   *
   * If this conditions are true, we'd send the keys to the MetaWidgetGenerator to handle all Caching.
   */
  shouldUpdateCacheKeys = (prevProps: ListWidgetProps) => {
    return (
      this.props.triggeredItemKey !== prevProps.triggeredItemKey ||
      this.props.selectedItemKey !== prevProps.selectedItemKey ||
      (!prevProps.serverSidePagination && this.props.serverSidePagination) ||
      (isString(this.props.selectedItemKey) &&
        !this.metaWidgetGenerator
          .getCurrCachedRows()
          .has(this.props.selectedItemKey))
    );
  };

  handleRowCacheData = () => {
    const { selectedItemKey, triggeredItemKey } = this.props;
    const keys = new Set(
      [selectedItemKey, triggeredItemKey].filter((key): key is string =>
        isString(key),
      ),
    );

    this.metaWidgetGenerator.handleCachedKeys(keys);
  };

  onItemClick = (rowIndex: number) => {
    this.handleSelectedItemAndKey(rowIndex);
    this.handleSelectedItemView(rowIndex);

    if (!this.props.onItemClick) return;

    try {
      const rowData = this.props.listData?.[rowIndex];
      const { jsSnippets } = getDynamicBindings(this.props.onItemClick);
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

  onItemClickCapture = (rowIndex: number) => {
    this.handleTriggeredItemAndKey(rowIndex);
    this.updateTriggeredItemView(rowIndex);
  };

  getPrimaryKeyByRowIndex = (rowIndex: number) => {
    return this.metaWidgetGenerator.getPrimaryKey(rowIndex);
  };

  // Updates SelectedItem and SelectedItemKey Meta Properties.
  handleSelectedItemAndKey = (rowIndex: number) => {
    const { selectedItemKey } = this.props;
    const key = this.getPrimaryKeyByRowIndex(rowIndex);

    let data: Record<string, unknown> | undefined;

    if (key === selectedItemKey) {
      this.resetSelectedItemKey();
      this.resetSelectedItem();

      return;
    }

    if (this.props.serverSidePagination) {
      const viewIndex = this.metaWidgetGenerator.getViewIndex(rowIndex);

      data = this.props.listData?.[viewIndex];
    } else {
      data = this.props.listData?.[rowIndex];
    }

    this.props.updateWidgetMetaProperty("selectedItemKey", key);
    this.props.updateWidgetMetaProperty("selectedItem", data);
  };

  resetSelectedItem = () => {
    this.props.updateWidgetMetaProperty("selectedItem", undefined);
  };

  handleSelectedItemView = (rowIndex: number) => {
    const { selectedItemKey } = this.props;
    const key = this.metaWidgetGenerator.getPrimaryKey(rowIndex);

    if (key === selectedItemKey) {
      this.resetSelectedItemView();
      this.resetSelectedItem();

      return;
    }

    this.updateSelectedItemView(rowIndex);
  };

  getItemViewBindingByRowIndex = (rowIndex: number) => {
    const container =
      this.metaWidgetGenerator.getRowContainerWidgetName(rowIndex);

    const itemViewBinding = container
      ? `{{ ${container}.data }}`
      : EMPTY_BINDING;

    return itemViewBinding;
  };

  updateSelectedItemView = (rowIndex: number) => {
    const binding = this.getItemViewBindingByRowIndex(rowIndex);

    this.props.updateWidgetMetaProperty("selectedItemView", binding);
  };

  updateSelectedItem = (rowIndex: number) => {
    const data = this.props.listData?.[rowIndex];

    if (!isEqual(this.props.selectedItem, data)) {
      this.props.updateWidgetMetaProperty("selectedItem", data);
    }
  };

  updateTriggeredItemView = (rowIndex: number) => {
    const binding = this.getItemViewBindingByRowIndex(rowIndex);

    this.props.updateWidgetMetaProperty("triggeredItemView", binding);
  };

  resetSelectedItemView = () => {
    this.props.updateWidgetMetaProperty("selectedItemView", {});
  };

  resetTriggeredItemView = () => {
    this.props.updateWidgetMetaProperty("triggeredItemView", {});
  };

  resetTriggeredItemKey = () => {
    this.props.updateWidgetMetaProperty("triggeredItemKey", null);
  };

  resetTriggeredItem = () =>
    this.props.updateWidgetMetaProperty("triggeredItem", undefined);

  // Updates TriggeredItem and TriggeredItemKey Meta Properties.
  handleTriggeredItemAndKey = (rowIndex: number) => {
    const { triggeredItem } = this.props;
    const key = this.metaWidgetGenerator.getPrimaryKey(rowIndex);
    let data: Record<string, unknown> | undefined;

    if (this.props.serverSidePagination) {
      const viewIndex = this.metaWidgetGenerator.getViewIndex(rowIndex);

      data = this.props.listData?.[viewIndex];
    } else {
      data = this.props.listData?.[rowIndex];
    }

    this.props.updateWidgetMetaProperty("triggeredItemKey", key);

    if (!isEqual(data, triggeredItem)) {
      this.props.updateWidgetMetaProperty("triggeredItem", data);
    }
  };

  resetSelectedItemKey = () => {
    this.props.updateWidgetMetaProperty("selectedItemKey", null);
  };

  resetTriggeredCache = () => {
    this.resetTriggeredItem();
    this.resetTriggeredItemKey();
    this.resetTriggeredItemView();
  };

  resetCache = () => {
    this.resetSelectedItem();
    this.resetSelectedItemKey();
    this.resetSelectedItemView();
    this.resetTriggeredItem();
    this.resetTriggeredItemKey();
    this.resetTriggeredItemView();
  };

  getTotalDataCount = () => {
    const defaultValue = 0;
    const { serverSidePagination, totalRecordsCount } = this.props;

    const totalRecords = Number(totalRecordsCount);

    if (!serverSidePagination) return (this.props.listData || []).length;

    if (typeof totalRecords === "number" && totalRecords > 0)
      return totalRecords;

    return defaultValue;
  };

  serverPaginationJustEnabled = (prevProps: ListWidgetProps) => {
    return Boolean(
      !prevProps.serverSidePagination && this.props.serverSidePagination,
    );
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
      const { componentWidth, parentColumnSpace, selectedItemKey, startIndex } =
        options;

      const childWidgets = (metaWidgetChildrenStructure || []).map(
        (childWidgetStructure) => {
          const child: ExtendedCanvasWidgetStructure = {
            ...childWidgetStructure,
          };

          child.parentColumnSpace = parentColumnSpace;
          child.rightColumn = componentWidth;
          child.canExtend = true;
          child.positioning = this.props.positioning;

          if (this.props.layoutSystemType === LayoutSystemTypes.AUTO) {
            child.isListWidgetCanvas = true;
          }

          child.children = child.children?.map((container, viewIndex) => {
            const rowIndex = viewIndex + startIndex;
            const focused =
              this.props.renderMode === RenderModes.CANVAS && rowIndex === 0;
            const key = this.metaWidgetGenerator.getPrimaryKey(rowIndex);

            if (
              this.props.layoutSystemType === LayoutSystemTypes.AUTO &&
              container.children?.[0]
            ) {
              container.children[0].isListWidgetCanvas = true;
            }

            return {
              ...container,
              focused,
              selected: selectedItemKey === key,
              onClick: (e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation();

                // If Container Child Elements are clickable, we should not call the containers onItemClick Event
                if (isTargetElementClickable(e)) return;

                this.onItemClick(rowIndex);
              },
              onClickCapture: () => {
                this.onItemClickCapture(rowIndex);
              },
            };
          });

          return renderAppsmithCanvas(child as WidgetProps);
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
          prevOptions.selectedItemKey === nextOptions.selectedItemKey &&
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
    const templateWidgetId =
      this.metaWidgetGenerator.getTemplateWidgetIdByMetaWidgetId(metaWidgetId);

    // Only update the template/canvas widget properties here.
    if (!templateWidgetId) {
      this.context?.batchUpdateWidgetProperty?.(
        metaWidgetId,
        updates,
        shouldReplay,
      );
    }
    // All meta widget property updates goes to the MetaWidget Reducers
    else {
      this.updateMetaWidgetProperty?.({
        updates,
        widgetId: metaWidgetId,
      });
    }
  };

  overrideUpdateWidget = (
    operation: WidgetOperation,
    metaWidgetId: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
  ) => {
    const templateWidgetId =
      this.metaWidgetGenerator.getTemplateWidgetIdByMetaWidgetId(metaWidgetId);
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.updateWidget?.(operation, widgetId, payload);
  };

  overrideUpdateWidgetProperty = (
    metaWidgetId: string,
    propertyName: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propertyValue: any,
  ) => {
    const templateWidgetId =
      this.metaWidgetGenerator.getTemplateWidgetIdByMetaWidgetId(metaWidgetId);
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.updateWidgetProperty?.(widgetId, propertyName, propertyValue);
  };

  overrideDeleteWidgetProperty = (
    metaWidgetId: string,
    propertyPaths: string[],
  ) => {
    const templateWidgetId =
      this.metaWidgetGenerator.getTemplateWidgetIdByMetaWidgetId(metaWidgetId);
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
    const totalDataCount = this.getTotalDataCount();

    return (
      this.shouldPaginate() &&
      (serverSidePagination && !totalDataCount ? (
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
          total={totalDataCount}
        />
      ))
    );
  };

  shouldRenderEmptyListComponent = (
    templateHeight: number,
    componentHeight: number,
  ) => {
    return (
      isNaN(templateHeight) ||
      templateHeight > componentHeight - 45 ||
      this.pageSize === 0
    );
  };

  getWidgetView() {
    const { componentHeight, componentWidth } = this.props;
    const { infiniteScroll, isLoading, parentColumnSpace, selectedItemKey } =
      this.props;
    const startIndex = this.metaWidgetGenerator.getStartIndex();
    const templateHeight = this.getTemplateHeight();

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

    if (this.shouldRenderEmptyListComponent(templateHeight, componentHeight)) {
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
        infiniteScroll={infiniteScroll}
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
            selectedItemKey,
            startIndex,
          })}
        </MetaWidgetContextProvider>
        {this.renderPaginationUI()}
      </ListComponent>
    );
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
  onItemClick?: string;
  pageNo: number;
  pageSize: number;
  prefixMetaWidgetId?: string;
  currentItemsView: string;
  selectedItemKey?: string | null;
  triggeredItemKey?: string | null;
  // Eval String
  selectedItemView: string;
  selectedItem?: Record<string, unknown>;
  triggeredItem?: Record<string, unknown>;
  primaryKeys?: (string | number | null)[];
  serverSidePagination?: boolean;
  nestedViewIndex?: number;
  defaultSelectedItem?: string;
  totalRecordsCount?: number | string;
}

export default ListWidget;
