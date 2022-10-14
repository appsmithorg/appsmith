import equal from "fast-deep-equal/es6";
import log from "loglevel";
import React from "react";
import { get, isNumber, range, omit, isEmpty } from "lodash";
import { klona } from "klona";

import derivedProperties from "./parseDerivedProperties";
import MetaWidgetContextProvider from "../../MetaWidgetContextProvider";
import MetaWidgetGenerator from "../MetaWidgetGenerator";
import propertyPaneConfig from "./propertyConfig";
import WidgetFactory from "utils/WidgetFactory";
import { BatchPropertyUpdatePayload } from "actions/controlActions";
import { DSLWidget, FlattenedWidgetProps } from "widgets/constants";
import { entityDefinitions } from "utils/autocomplete/EntityDefinitions";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { PrivateWidgets } from "entities/DataTree/dataTreeFactory";
import {
  GridDefaults,
  RenderModes,
  WidgetType,
} from "constants/WidgetConstants";
import BaseWidget, {
  WidgetBaseProps,
  WidgetOperation,
  WidgetProps,
} from "widgets/BaseWidget";
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

export type GenerateMetaWidgetOptions = {
  parentId: string;
  widgetId?: string; // TODO: (Ashit) Remove this
  templateWidgetId?: string;
  metaWidgets?: MetaWidgets;
  key: string; // TODO: (Ashit) - Make this field optional and use hash of data items
  prevFlattenedChildCanvasWidgets: ListWidgetProps<
    WidgetProps
  >["flattenedChildCanvasWidgets"];
};

type ListWidgetState = {
  page: number;
};

const LIST_WIDGET_PAGINATION_HEIGHT = 36;

/* in the List Widget, "children.0.children.0.children.0.children" is the path to the list of all
  widgets present in the List Widget
*/
const PATH_TO_ALL_WIDGETS_IN_LIST_WIDGET =
  "children.0.children.0.children.0.children";

class ListWidget extends BaseWidget<
  ListWidgetProps<WidgetProps>,
  ListWidgetState
> {
  state = {
    page: 1,
  };

  metaWidgetGenerator: MetaWidgetGenerator;
  prevMetaContainerNames: string[];
  /**
   * returns the property pane config of the widget
   */
  static getPropertyPaneConfig() {
    return propertyPaneConfig;
  }

  static getDerivedPropertiesMap() {
    return {
      pageSize: `{{(()=>{${derivedProperties.getPageSize}})()}}`,
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

  constructor(
    props:
      | ListWidgetProps<WidgetProps>
      | Readonly<ListWidgetProps<WidgetProps>>,
  ) {
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
      isListCloned,
      level: props.level || 1,
      widgetId: props.widgetId,
    });
    this.prevMetaContainerNames = [];
  }

  componentDidMount() {
    if (this.props.serverSidePaginationEnabled && !this.props.pageNo) {
      this.props.updateWidgetMetaProperty("pageNo", 1);
    }

    this.generateChildrenEntityDefinitions(this.props);

    // add privateWidgets to ListWidget
    this.addPrivateWidgetsForChildren(this.props);

    this.generateMetaWidgets();
  }

  componentDidUpdate(prevProps: ListWidgetProps<WidgetProps>) {
    this.generateMetaWidgets(prevProps.flattenedChildCanvasWidgets);

    // TODO: Call generateChildrenEntityDefinitions to update

    if (this.props.serverSidePaginationEnabled) {
      if (!this.props.pageNo) this.props.updateWidgetMetaProperty("pageNo", 1);
      // run onPageSizeChange if user resize widgets
      if (
        this.props.onPageSizeChange &&
        this.props.pageSize !== prevProps.pageSize
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

    if (this.getMainContainer()?.bottomRow !== this.props.templateBottomRow) {
      super.updateWidgetProperty(
        "templateBottomRow",
        this.getMainContainer()?.bottomRow,
      );
    }
    // if (
    //   get(this.props.childWidgets, "0.children.0.bottomRow") !==
    //   get(prevProps.childWidgets, "0.children.0.bottomRow")
    // ) {
    //   this.props.updateWidgetMetaProperty(
    //     "templateBottomRow",
    //     get(this.props.childWidgets, "0.children.0.bottomRow"),
    //     {
    //       triggerPropertyName: "onPageSizeChange",
    //       dynamicString: this.props.onPageSizeChange,
    //       event: {
    //         type: EventType.ON_PAGE_SIZE_CHANGE,
    //       },
    //     },
    //   );
    // }

    // TODO: Update privateWidget field if there is a change in the List widget children
    // if (!isEqual(currentListWidgetChildren, previousListWidgetChildren)) {
    //   this.addPrivateWidgetsForChildren(this.props);
    // }
  }
  componentWillUnmount(): void {
    this.deleteMetaWidgets();
  }

  generateMetaWidgets = (
    prevFlattenedChildCanvasWidgets?: WidgetBaseProps["flattenedChildCanvasWidgets"],
  ) => {
    const { page } = this.state;
    const {
      dynamicPathMapList = {},
      flattenedChildCanvasWidgets = {},
      listData = [],
      mainCanvasId = "",
      mainContainerId = "",
      pageSize,
    } = this.props;

    const startIndex = pageSize * (page - 1);
    const currentViewData = listData.slice(startIndex, startIndex + pageSize);

    const { metaWidgets, removedMetaWidgetIds } = this.metaWidgetGenerator
      .withOptions({
        containerParentId: mainCanvasId,
        containerWidgetId: mainContainerId,
        currTemplateWidgets: flattenedChildCanvasWidgets,
        data: currentViewData,
        dynamicPathMapList,
        gridGap: this.getGridGap(),
        levelData: this.props.levelData,
        prevTemplateWidgets: prevFlattenedChildCanvasWidgets,
        primaryKey: "id",
        startIndex,
        widgetName: this.props.widgetName,
      })
      .generate();

    this.updateCurrentViewItems();
    const mainCanvasWidget = this.generateMainCanvasMetaWidget();
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

  generateMainCanvasMetaWidget = () => {
    const {
      ids: currMetaContainerIds,
      names: currMetaContainerNames,
    } = this.metaWidgetGenerator.getMetaContainers();

    if (!equal(this.prevMetaContainerNames, currMetaContainerNames)) {
      const mainCanvasWidget = this.mainCanvasMetaWidget() as MetaWidget;
      mainCanvasWidget.children = currMetaContainerIds;

      return mainCanvasWidget;
    }
  };

  updateCurrentViewItems = () => {
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

  getMainContainer = () => {
    const {
      mainContainerId = "",
      flattenedChildCanvasWidgets = {},
    } = this.props;
    return flattenedChildCanvasWidgets[mainContainerId] || {};
  };

  mainCanvasMetaWidget = () => {
    const { flattenedChildCanvasWidgets = {}, mainCanvasId = "" } = this.props;
    const mainCanvasWidget = flattenedChildCanvasWidgets[mainCanvasId] || {};
    const { shouldPaginate } = this.shouldPaginate();
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    const metaMainCanvas = klona(mainCanvasWidget) ?? {};
    const { metaWidgetId, metaWidgetName } =
      this.metaWidgetGenerator.getContainerParentCache() || {};

    if (!metaWidgetId || !metaWidgetName) return;

    metaMainCanvas.parentId = this.props.widgetId;
    metaMainCanvas.widgetId = metaWidgetId;
    metaMainCanvas.widgetName = metaWidgetName;
    metaMainCanvas.canExtend = undefined;
    metaMainCanvas.isVisible = this.props.isVisible;
    metaMainCanvas.minHeight = componentHeight;
    metaMainCanvas.rightColumn = componentWidth;
    metaMainCanvas.noPad = true;
    metaMainCanvas.bottomRow = shouldPaginate
      ? componentHeight - LIST_WIDGET_PAGINATION_HEIGHT
      : componentHeight;

    return metaMainCanvas;
  };

  /**
   * generates the children entity definitions for children
   *
   * by entity definition we mean properties that will be open for users for autocomplete
   *
   * @param props
   */
  generateChildrenEntityDefinitions(props: ListWidgetProps<WidgetProps>) {
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
  addPrivateWidgetsForChildren(props: ListWidgetProps<WidgetProps>) {
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
   * paginate items
   *
   * @param children
   */
  paginateItems = (children: DSLWidget[]) => {
    // return all children if serverside pagination
    if (this.props.serverSidePaginationEnabled) return children;
    const { page } = this.state;
    const { perPage, shouldPaginate } = this.shouldPaginate();

    if (shouldPaginate) {
      return children.slice((page - 1) * perPage, page * perPage);
    }

    return children;
  };

  /**
   * 400
   * 200
   * can data be paginated
   */
  shouldPaginate = () => {
    const { listData, pageSize, serverSidePaginationEnabled } = this.props;

    if (serverSidePaginationEnabled) {
      return { shouldPaginate: true, perPage: pageSize };
    }

    if (!listData?.length) {
      return { shouldPaginate: false, perPage: 0 };
    }

    const shouldPaginate = pageSize < listData.length;

    return { shouldPaginate, perPage: pageSize };
  };

  renderChildren = () => {
    const { componentWidth } = this.getComponentDimensions();
    return (this.props.metaWidgetChildrenStructure || []).map(
      (childWidgetStructure) => {
        const child = { ...childWidgetStructure };
        child.parentColumnSpace = this.props.parentColumnSpace;
        // This gets replaced in withWidgetProps.
        child.rightColumn = componentWidth;
        return WidgetFactory.createWidget(child, this.props.renderMode);
      },
    );
  };

  onClientPageChange = (page: number) => this.setState({ page });

  overrideExecuteAction = (triggerPayload: ExecuteTriggerPayload) => {
    const { id: metaWidgetId } = triggerPayload?.source || {};

    if (metaWidgetId) {
      const { index } = this.metaWidgetGenerator.getPropsByMetaWidgetId(
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
    } = this.metaWidgetGenerator.getPropsByMetaWidgetId(metaWidgetId);
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
    } = this.metaWidgetGenerator.getPropsByMetaWidgetId(metaWidgetId);
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
    } = this.metaWidgetGenerator.getPropsByMetaWidgetId(metaWidgetId);
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.updateWidgetProperty?.(widgetId, propertyName, propertyValue);
  };

  overrideDeleteWidgetProperty = (
    metaWidgetId: string,
    propertyPaths: string[],
  ) => {
    const {
      templateWidgetId,
    } = this.metaWidgetGenerator.getPropsByMetaWidgetId(metaWidgetId);
    const widgetId = templateWidgetId || metaWidgetId;

    this.context?.deleteWidgetProperty?.(widgetId, propertyPaths);
  };

  /**
   * view that is rendered in editor
   */
  getPageView() {
    const { componentHeight } = this.getComponentDimensions();
    const { pageNo, serverSidePaginationEnabled } = this.props;
    const { perPage, shouldPaginate } = this.shouldPaginate();
    const mainChildContainer = this.getMainContainer();
    const templateBottomRow = mainChildContainer.bottomRow;
    const templateHeight =
      templateBottomRow * GridDefaults.DEFAULT_GRID_ROW_HEIGHT;

    if (this.props.isLoading) {
      return (
        <ListComponentLoading className="">
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
        {...this.props}
        backgroundColor={this.props.backgroundColor}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        hasPagination={shouldPaginate}
        listData={this.props.listData || []}
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
              perPage={perPage}
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

export interface ListWidgetProps<T extends WidgetProps> extends WidgetProps {
  accentColor: string;
  backgroundColor: string;
  borderRadius: string;
  boxShadow?: string;
  children?: T[];
  currentItemStructure?: Record<string, string>;
  dynamicPathMapList?: DynamicPathMapList;
  gridGap?: number;
  level?: number;
  levelData?: LevelData;
  listData?: Array<Record<string, unknown>>;
  mainCanvasId?: string;
  mainContainerId?: string;
  onListItemClick?: string;
  shouldScrollContents?: boolean;
}

export default ListWidget;
