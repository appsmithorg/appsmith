import {
  getFocusedWidget,
  getSelectedWidget,
  getWidgetMetaProps,
  getWidgets,
} from "./selectors";
import _, { isString, remove } from "lodash";
import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
  WidgetType,
} from "constants/WidgetConstants";
import { all, call } from "redux-saga/effects";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { select } from "redux-saga/effects";
import { getCopiedWidgets } from "utils/storage";
import { WidgetProps } from "widgets/BaseWidget";
import { getSelectedWidgets } from "selectors/ui";
import { generateReactKey } from "utils/generators";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { getDataTree } from "selectors/dataTreeSelectors";
import {
  getDynamicBindings,
  combineDynamicBindings,
  DynamicPath,
} from "utils/DynamicBindingUtils";
import { getNextEntityName } from "utils/AppsmithUtils";
import WidgetFactory from "utils/WidgetFactory";
import { getParentWithEnhancementFn } from "./WidgetEnhancementHelpers";

export interface CopiedWidgetGroup {
  widgetId: string;
  parentId: string;
  list: WidgetProps[];
}

/**
 * checks if triggerpaths contains property path passed
 *
 * @param isTriggerProperty
 * @param propertyPath
 * @param triggerPaths
 * @returns
 */
export const doesTriggerPathsContainPropertyPath = (
  isTriggerProperty: boolean,
  propertyPath: string,
  triggerPaths?: string[],
) => {
  if (!isTriggerProperty) {
    if (
      triggerPaths &&
      triggerPaths.length &&
      triggerPaths.includes(propertyPath)
    ) {
      return true;
    }
  }

  return isTriggerProperty;
};

/**
 *
 * check if copied widget is being pasted in list widget,
 * if yes, change all keys in template of list widget and
 * update dynamicBindingPathList of ListWidget
 *
 * updates in list widget :
 * 1. `dynamicBindingPathList`
 * 2. `template`
 *
 * @param widget
 * @param widgets
 */
export const handleIfParentIsListWidgetWhilePasting = (
  widget: FlattenedWidgetProps,
  widgets: { [widgetId: string]: FlattenedWidgetProps },
): { [widgetId: string]: FlattenedWidgetProps } => {
  let root = _.get(widgets, `${widget.parentId}`);

  while (root && root.parentId && root.widgetId !== MAIN_CONTAINER_WIDGET_ID) {
    if (root.type === "LIST_WIDGET") {
      const listWidget = root;
      const currentWidget = _.cloneDeep(widget);
      let template = _.get(listWidget, "template", {});
      const dynamicBindingPathList: any[] = _.get(
        listWidget,
        "dynamicBindingPathList",
        [],
      ).slice();

      // iterating over each keys of the new createdWidget checking if value contains currentItem
      const keys = Object.keys(currentWidget);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        let value = currentWidget[key];

        if (isString(value) && value.indexOf("currentItem") > -1) {
          const { jsSnippets, stringSegments } = getDynamicBindings(value);

          const js = combineDynamicBindings(jsSnippets, stringSegments);

          value = `{{${listWidget.widgetName}.listData.map((currentItem) => ${js})}}`;

          currentWidget[key] = value;

          dynamicBindingPathList.push({
            key: `template.${currentWidget.widgetName}.${key}`,
          });
        }
      }

      template = {
        ...template,
        [currentWidget.widgetName]: currentWidget,
      };

      // now we have updated `dynamicBindingPathList` and updatedTemplate
      // we need to update it the list widget
      widgets[listWidget.widgetId] = {
        ...listWidget,
        template,
        dynamicBindingPathList,
      };
    }

    root = widgets[root.parentId];
  }

  return widgets;
};

/**
 * this saga handles special cases when pasting the widget
 *
 * for e.g - when the list widget is being copied, we want to update template of list widget
 * with new widgets name
 *
 * @param widget
 * @param widgets
 * @param widgetNameMap
 * @param newWidgetList
 * @returns
 */
export const handleSpecificCasesWhilePasting = (
  widget: FlattenedWidgetProps,
  widgets: { [widgetId: string]: FlattenedWidgetProps },
  widgetNameMap: Record<string, string>,
  newWidgetList: FlattenedWidgetProps[],
) => {
  // this is the case when whole list widget is copied and pasted
  if (widget?.type === "LIST_WIDGET") {
    Object.keys(widget.template).map((widgetName) => {
      const oldWidgetName = widgetName;
      const newWidgetName = widgetNameMap[oldWidgetName];

      const newWidget = newWidgetList.find(
        (w: any) => w.widgetName === newWidgetName,
      );

      if (newWidget) {
        newWidget.widgetName = newWidgetName;

        if (widgetName === oldWidgetName) {
          widget.template[newWidgetName] = {
            ...widget.template[oldWidgetName],
            widgetId: newWidget.widgetId,
            widgetName: newWidget.widgetName,
          };

          delete widget.template[oldWidgetName];
        }
      }

      // updating dynamicBindingPath in copied widget if the copied widge thas reference to oldWidgetNames
      widget.dynamicBindingPathList = (widget.dynamicBindingPathList || []).map(
        (path: any) => {
          if (path.key.startsWith(`template.${oldWidgetName}`)) {
            return {
              key: path.key.replace(
                `template.${oldWidgetName}`,
                `template.${newWidgetName}`,
              ),
            };
          }

          return path;
        },
      );
    });

    widgets[widget.widgetId] = widget;
  } else if (widget?.type === "MODAL_WIDGET") {
    // if Modal is being copied handle all onClose action rename
    const oldWidgetName = Object.keys(widgetNameMap).find(
      (key) => widgetNameMap[key] === widget.widgetName,
    );
    // get all the button, icon widgets
    const copiedBtnIcnWidgets = _.filter(
      newWidgetList,
      (copyWidget) =>
        copyWidget.type === "BUTTON_WIDGET" ||
        copyWidget.type === "ICON_WIDGET",
    );
    // replace oldName with new one if any of this widget have onClick action for old modal
    copiedBtnIcnWidgets.map((copyWidget) => {
      if (copyWidget.onClick) {
        const newOnClick = widgets[copyWidget.widgetId].onClick.replace(
          oldWidgetName,
          widget.widgetName,
        );
        _.set(widgets[copyWidget.widgetId], "onClick", newOnClick);
      }
    });
  }

  widgets = handleIfParentIsListWidgetWhilePasting(widget, widgets);

  return widgets;
};

export function getWidgetChildren(
  canvasWidgets: CanvasWidgetsReduxState,
  widgetId: string,
): any {
  const childrenIds: string[] = [];
  const widget = _.get(canvasWidgets, widgetId);
  // When a form widget tries to resetChildrenMetaProperties
  // But one or more of its container like children
  // have just been deleted, widget can be undefined
  if (widget === undefined) {
    return [];
  }
  const { children = [] } = widget;
  if (children && children.length) {
    for (const childIndex in children) {
      if (children.hasOwnProperty(childIndex)) {
        const child = children[childIndex];
        childrenIds.push(child);
        const grandChildren = getWidgetChildren(canvasWidgets, child);
        if (grandChildren.length) {
          childrenIds.push(...grandChildren);
        }
      }
    }
  }
  return childrenIds;
}

export const getParentWidgetIdForPasting = function*(
  widgets: CanvasWidgetsReduxState,
  selectedWidget: FlattenedWidgetProps | undefined,
) {
  let newWidgetParentId = MAIN_CONTAINER_WIDGET_ID;
  let parentWidget = widgets[MAIN_CONTAINER_WIDGET_ID];

  // If the selected widget is not the main container
  if (selectedWidget && selectedWidget.widgetId !== MAIN_CONTAINER_WIDGET_ID) {
    // Select the parent of the selected widget if parent is not
    // the main container
    if (
      selectedWidget &&
      selectedWidget.parentId &&
      selectedWidget.parentId !== MAIN_CONTAINER_WIDGET_ID &&
      widgets[selectedWidget.parentId]
    ) {
      const children = widgets[selectedWidget.parentId].children || [];
      if (children.length > 0) {
        parentWidget = widgets[selectedWidget.parentId];
        newWidgetParentId = selectedWidget.parentId;
      }
    }
    // Select the selected widget if the widget is container like ( excluding list widget )
    if (selectedWidget.children && selectedWidget.type !== "LIST_WIDGET") {
      parentWidget = widgets[selectedWidget.widgetId];
    }
  }

  // If the parent widget in which to paste the copied widget
  // is not the main container and is not a canvas widget
  if (
    parentWidget.widgetId !== MAIN_CONTAINER_WIDGET_ID &&
    parentWidget.type !== "CANVAS_WIDGET"
  ) {
    let childWidget;
    // If the widget in which to paste the new widget is NOT
    // a tabs widget
    if (parentWidget.type !== "TABS_WIDGET") {
      // The child will be a CANVAS_WIDGET, as we've established
      // this parent widget to be a container like widget
      // Which always has its first child as a canvas widget
      childWidget = parentWidget.children && widgets[parentWidget.children[0]];
    } else {
      // If the widget in which to paste the new widget is a tabs widget
      // Find the currently selected tab canvas widget
      const { selectedTabWidgetId } = yield select(
        getWidgetMetaProps,
        parentWidget.widgetId,
      );
      if (selectedTabWidgetId) childWidget = widgets[selectedTabWidgetId];
    }
    // If the finally selected parent in which to paste the widget
    // is a CANVAS_WIDGET, use its widgetId as the new widget's parent Id
    if (childWidget && childWidget.type === "CANVAS_WIDGET") {
      newWidgetParentId = childWidget.widgetId;
    }
  }
  return newWidgetParentId;
};

export const isCopiedModalWidget = function(
  copiedWidgetGroups: CopiedWidgetGroup[],
  widgets: CanvasWidgetsReduxState,
) {
  if (copiedWidgetGroups.length !== 1) return false;

  const copiedWidget = widgets[copiedWidgetGroups[0].widgetId];

  if (copiedWidget && copiedWidget.type === "MODAL_WIDGET") return true;

  return false;
};

export const checkIfPastingIntoListWidget = function(
  canvasWidgets: CanvasWidgetsReduxState,
  selectedWidget: FlattenedWidgetProps | undefined,
  copiedWidgets: {
    widgetId: string;
    parentId: string;
    list: WidgetProps[];
  }[],
) {
  // when list widget is selected, if the user is pasting, we want it to be pasted in the template
  // which is first children of list widget
  if (
    selectedWidget &&
    selectedWidget.children &&
    selectedWidget?.type === "LIST_WIDGET"
  ) {
    const childrenIds: string[] = getWidgetChildren(
      canvasWidgets,
      selectedWidget.children[0],
    );
    const firstChildId = childrenIds[0];

    // if any copiedWidget is a list widget, we will paste into the parent of list widget
    for (let i = 0; i < copiedWidgets.length; i++) {
      const copiedWidgetId = copiedWidgets[i].widgetId;
      const copiedWidget = canvasWidgets[copiedWidgetId];

      if (copiedWidget?.type === "LIST_WIDGET") {
        return selectedWidget;
      }
    }

    return _.get(canvasWidgets, firstChildId);
  }
  return selectedWidget;
};

/**
 * get top, left, right, bottom most widgets from copied groups when pasting
 *
 * @param copiedWidgetGroups
 * @returns
 */
export const getBoundaryWidgetsFromCopiedGroups = function(
  copiedWidgetGroups: CopiedWidgetGroup[],
) {
  const topMostWidget = copiedWidgetGroups.sort(
    (a, b) => a.list[0].topRow - b.list[0].topRow,
  )[0].list[0];
  const leftMostWidget = copiedWidgetGroups.sort(
    (a, b) => a.list[0].leftColumn - b.list[0].leftColumn,
  )[0].list[0];
  const rightMostWidget = copiedWidgetGroups.sort(
    (a, b) => b.list[0].rightColumn - a.list[0].rightColumn,
  )[0].list[0];
  const bottomMostWidget = copiedWidgetGroups.sort(
    (a, b) => b.list[0].bottomRow - a.list[0].bottomRow,
  )[0].list[0];

  return {
    topMostWidget,
    leftMostWidget,
    rightMostWidget,
    bottomMostWidget,
  };
};

/**
 * -------------------------------------------------------------------------------
 * OPERATION = PASTING
 * -------------------------------------------------------------------------------
 *
 * following are the functions are that used in pasting operation
 */

/**
 * selects the selectedWidget.
 * In case of LIST_WIDGET, it selects the list widget instead of selecting the
 * container inside the list widget
 *
 * @param canvasWidgets
 * @param copiedWidgetGroups
 * @returns
 */
export const getSelectedWidgetWhenPasting = function*() {
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const copiedWidgetGroups: CopiedWidgetGroup[] = yield getCopiedWidgets();

  let selectedWidget: FlattenedWidgetProps | undefined = yield select(
    getSelectedWidget,
  );

  const focusedWidget: FlattenedWidgetProps | undefined = yield select(
    getFocusedWidget,
  );

  selectedWidget = checkIfPastingIntoListWidget(
    canvasWidgets,
    selectedWidget || focusedWidget,
    copiedWidgetGroups,
  );

  return selectedWidget;
};

/**
 * group copied widgets into a container
 *
 * @param copiedWidgetGroups
 * @param pastingIntoWidgetId
 * @returns
 */
export const groupWidgetsIntoContainer = function*(
  copiedWidgetGroups: CopiedWidgetGroup[],
  pastingIntoWidgetId: string,
) {
  const containerWidgetId = generateReactKey();
  const evalTree: DataTree = yield select(getDataTree);
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const newContainerName = getNextWidgetName(
    canvasWidgets,
    "CONTAINER_WIDGET",
    evalTree,
  );
  const newCanvasName = getNextWidgetName(
    canvasWidgets,
    "CANVAS_WIDGET",
    evalTree,
  );
  const {
    bottomMostWidget,
    leftMostWidget,
    rightMostWidget,
    topMostWidget,
  } = getBoundaryWidgetsFromCopiedGroups(copiedWidgetGroups);

  const copiedWidgets = copiedWidgetGroups.map((copiedWidgetGroup) =>
    copiedWidgetGroup.list.find(
      (w) => w.widgetId === copiedWidgetGroup.widgetId,
    ),
  );
  const parentColumnSpace =
    copiedWidgetGroups[0].list[0].parentColumnSpace || 1;

  const boundary = {
    top: _.minBy(copiedWidgets, (copiedWidget) => copiedWidget?.topRow),
    left: _.minBy(copiedWidgets, (copiedWidget) => copiedWidget?.leftColumn),
    bottom: _.maxBy(copiedWidgets, (copiedWidget) => copiedWidget?.bottomRow),
    right: _.maxBy(copiedWidgets, (copiedWidget) => copiedWidget?.rightColumn),
  };

  const widthPerColumn =
    ((rightMostWidget.rightColumn - leftMostWidget.leftColumn) *
      parentColumnSpace) /
    GridDefaults.DEFAULT_GRID_COLUMNS;
  const heightOfCanvas =
    (bottomMostWidget.bottomRow - topMostWidget.topRow) * parentColumnSpace;
  const widthOfCanvas =
    (rightMostWidget.rightColumn - leftMostWidget.leftColumn) *
    parentColumnSpace;

  const newCanvasWidget: FlattenedWidgetProps = {
    ..._.omit(
      _.get(
        WidgetFactory.widgetConfigMap.get("CONTAINER_WIDGET"),
        "blueprint.view[0]",
      ),
      ["position"],
    ),
    ..._.get(
      WidgetFactory.widgetConfigMap.get("CONTAINER_WIDGET"),
      "blueprint.view[0].props",
    ),
    bottomRow: heightOfCanvas,
    isLoading: false,
    isVisible: true,
    leftColumn: 0,
    minHeight: heightOfCanvas,
    parentColumnSpace: 1,
    parentId: pastingIntoWidgetId,
    parentRowSpace: 1,
    rightColumn: widthOfCanvas,
    topRow: 0,
    renderMode: RenderModes.CANVAS,
    version: 1,
    widgetId: generateReactKey(),
    widgetName: newCanvasName,
  };
  const newContainerWidget: FlattenedWidgetProps = {
    ..._.omit(WidgetFactory.widgetConfigMap.get("CONTAINER_WIDGET"), [
      "rows",
      "columns",
      "blueprint",
    ]),
    parentId: pastingIntoWidgetId,
    widgetName: newContainerName,
    type: "CONTAINER_WIDGET",
    widgetId: containerWidgetId,
    leftColumn: boundary.left?.leftColumn || 0,
    topRow: boundary.top?.topRow || 0,
    bottomRow: (boundary.bottom?.bottomRow || 0) + 2,
    rightColumn: boundary.right?.rightColumn || 0,
    tabId: "",
    children: [newCanvasWidget.widgetId],
    renderMode: RenderModes.CANVAS,
    version: 1,
    isLoading: false,
    isVisible: true,
    parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    parentColumnSpace: widthPerColumn,
  };
  newCanvasWidget.parentId = newContainerWidget.widgetId;
  const percentageIncrease = parentColumnSpace / widthPerColumn;

  const list = copiedWidgetGroups.map((copiedWidgetGroup) => {
    return [
      ...copiedWidgetGroup.list.map((listItem) => {
        if (listItem.widgetId === copiedWidgetGroup.widgetId) {
          newCanvasWidget.children = _.get(newCanvasWidget, "children", []);
          newCanvasWidget.children = [
            ...newCanvasWidget.children,
            listItem.widgetId,
          ];

          return {
            ...listItem,
            leftColumn:
              (listItem.leftColumn - leftMostWidget.leftColumn) *
              percentageIncrease,
            rightColumn:
              (listItem.rightColumn - leftMostWidget.leftColumn) *
              percentageIncrease,
            topRow: listItem.topRow - topMostWidget.topRow,
            bottomRow: listItem.bottomRow - topMostWidget.topRow,
            parentId: newCanvasWidget.widgetId,
            parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
            parentColumnSpace: widthPerColumn,
          };
        }

        return listItem;
      }),
    ];
  });

  const flatList = _.flattenDeep(list);

  return [
    {
      list: [newContainerWidget, newCanvasWidget, ...flatList],
      widgetId: newContainerWidget.widgetId,
      parentId: pastingIntoWidgetId,
    },
  ];
};

/**
 * create copiedWidgets objects from selected widgets
 *
 * @returns
 */
export const createSelectedWidgetsAsCopiedWidgets = function*() {
  const canvasWidgets: {
    [widgetId: string]: FlattenedWidgetProps;
  } = yield select(getWidgets);
  const selectedWidgetIDs: string[] = yield select(getSelectedWidgets);
  const selectedWidgets = selectedWidgetIDs.map((each) => canvasWidgets[each]);

  if (!selectedWidgets || !selectedWidgets.length) return;

  const widgetListsToStore: {
    widgetId: string;
    parentId: string;
    list: FlattenedWidgetProps[];
  }[] = yield all(selectedWidgets.map((each) => call(createWidgetCopy, each)));

  return widgetListsToStore;
};

/**
 * return canvasWidgets without selectedWidgets and remove the selected widgets
 * ids in the children of parent widget
 *
 * @return
 */
export const filterOutSelectedWidgets = function*(
  parentId: string,
  copiedWidgetGroups: CopiedWidgetGroup[],
) {
  const canvasWidgets: CanvasWidgetsReduxState = yield _.cloneDeep(
    select(getWidgets),
  );

  const selectedWidgetIDs: string[] = _.flattenDeep(
    copiedWidgetGroups.map((copiedWidgetGroup) => {
      return copiedWidgetGroup.list.map((widget) => widget.widgetId);
    }),
  );

  const filteredWidgets: CanvasWidgetsReduxState = _.omit(
    canvasWidgets,
    selectedWidgetIDs,
  );

  return {
    ...filteredWidgets,
    [parentId]: {
      ...filteredWidgets[parentId],
      // removing the selected widgets ids in the children of parent widget
      children: _.get(filteredWidgets[parentId], "children", []).filter(
        (widgetId) => {
          return !selectedWidgetIDs.includes(widgetId);
        },
      ),
    },
  };
};

/**
 * checks if selected widgets are colliding with other widgets or not
 *
 * @param widgets
 * @param copiedWidgetGroups
 * @returns
 */
export const isSelectedWidgetsColliding = function*(
  widgets: CanvasWidgetsReduxState,
  copiedWidgetGroups: CopiedWidgetGroup[],
  pastingIntoWidgetId: string,
) {
  if (!copiedWidgetGroups.length) return false;

  const {
    bottomMostWidget,
    leftMostWidget,
    rightMostWidget,
    topMostWidget,
  } = getBoundaryWidgetsFromCopiedGroups(copiedWidgetGroups);

  const widgetsWithSameParent = _.omitBy(widgets, (widget) => {
    return widget.parentId !== pastingIntoWidgetId;
  });

  const widgetsArray = Object.values(widgetsWithSameParent).filter(
    (widget) =>
      widget.parentId === pastingIntoWidgetId && widget.type !== "MODAL_WIDGET",
  );

  let isColliding = false;

  for (let i = 0; i < widgetsArray.length; i++) {
    const widget = widgetsArray[i];

    if (
      widget.bottomRow + 2 < topMostWidget.topRow ||
      widget.topRow > bottomMostWidget.bottomRow
    ) {
      isColliding = false;
    } else if (
      widget.rightColumn < leftMostWidget.leftColumn ||
      widget.leftColumn > rightMostWidget.rightColumn
    ) {
      isColliding = false;
    } else {
      return true;
    }
  }

  return isColliding;
};

/**
 * get next widget name to be used
 *
 * @param widgets
 * @param type
 * @param evalTree
 * @param options
 * @returns
 */
export function getNextWidgetName(
  widgets: CanvasWidgetsReduxState,
  type: WidgetType,
  evalTree: DataTree,
  options?: Record<string, unknown>,
) {
  // Compute the new widget's name
  const defaultConfig: any = WidgetFactory.widgetConfigMap.get(type);
  const widgetNames = Object.keys(widgets).map((w) => widgets[w].widgetName);
  const entityNames = Object.keys(evalTree);
  let prefix = defaultConfig.widgetName;
  if (options && options.prefix) {
    prefix = `${options.prefix}${
      widgetNames.indexOf(options.prefix as string) > -1 ? "Copy" : ""
    }`;
  }

  return getNextEntityName(
    prefix,
    [...widgetNames, ...entityNames],
    options?.startWithoutIndex as boolean,
  );
}

/**
 * creates widget copied groups
 *
 * @param widget
 * @returns
 */
export function* createWidgetCopy(widget: FlattenedWidgetProps) {
  const allWidgets: { [widgetId: string]: FlattenedWidgetProps } = yield select(
    getWidgets,
  );
  const widgetsToStore = getAllWidgetsInTree(widget.widgetId, allWidgets);
  return {
    widgetId: widget.widgetId,
    list: widgetsToStore,
    parentId: widget.parentId,
  };
}

/**
 * get all widgets in tree
 *
 * @param widgetId
 * @param canvasWidgets
 * @returns
 */
export const getAllWidgetsInTree = (
  widgetId: string,
  canvasWidgets: CanvasWidgetsReduxState,
) => {
  const widget = canvasWidgets[widgetId];
  const widgetList = [widget];
  if (widget && widget.children) {
    widget.children
      .filter(Boolean)
      .forEach((childWidgetId: string) =>
        widgetList.push(...getAllWidgetsInTree(childWidgetId, canvasWidgets)),
      );
  }
  return widgetList;
};

export const getParentBottomRowAfterAddingWidget = (
  stateParent: FlattenedWidgetProps,
  newWidget: FlattenedWidgetProps,
) => {
  const parentRowSpace =
    newWidget.parentRowSpace || GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  const updateBottomRow =
    stateParent.type === "CANVAS_WIDGET" &&
    newWidget.bottomRow * parentRowSpace > stateParent.bottomRow;
  return updateBottomRow
    ? Math.max(
        (newWidget.bottomRow + GridDefaults.CANVAS_EXTENSION_OFFSET) *
          parentRowSpace,
        stateParent.bottomRow,
      )
    : stateParent.bottomRow;
};

/**
 * sometimes, selected widgets contains the grouped widget,
 * in those cases, we will just selected the main container as the
 * pastingIntoWidget
 *
 * @param copiedWidgetGroups
 * @param pastingIntoWidgetId
 */
export function* getParentWidgetIdForGrouping(
  widgets: CanvasWidgetsReduxState,
  copiedWidgetGroups: CopiedWidgetGroup[],
  pastingIntoWidgetId: string,
) {
  const widgetIds = copiedWidgetGroups.map(
    (widgetGroup) => widgetGroup.widgetId,
  );

  // the pastingIntoWidgetId should parent of copiedWidgets
  for (let i = 0; i < widgetIds.length; i++) {
    const widgetId = widgetIds[i];
    const widget = widgets[widgetId];

    if (widget.parentId !== pastingIntoWidgetId) {
      return MAIN_CONTAINER_WIDGET_ID;
    }
  }

  return pastingIntoWidgetId;
}

/**
 * this saga clears out the enhancementMap, template, dynamicBindingPathList and dynamicTriggerPathList when a child
 * is deleted in list widget
 *
 * @param widgets
 * @param widgetId
 * @param widgetName
 * @param parentId
 */
export function updateListWidgetPropertiesOnChildDelete(
  widgets: CanvasWidgetsReduxState,
  widgetId: string,
  widgetName: string,
) {
  const clone = JSON.parse(JSON.stringify(widgets));

  const parentWithEnhancementFn = getParentWithEnhancementFn(widgetId, clone);

  if (parentWithEnhancementFn?.type === "LIST_WIDGET") {
    const listWidget = parentWithEnhancementFn;

    // delete widget in template of list
    if (listWidget && widgetName in listWidget.template) {
      listWidget.template[widgetName] = undefined;
    }

    // delete dynamic binding path if any
    remove(listWidget?.dynamicBindingPathList || [], (path: any) =>
      path.key.startsWith(`template.${widgetName}`),
    );

    // delete dynamic trigger path if any
    remove(listWidget?.dynamicTriggerPathList || [], (path: any) =>
      path.key.startsWith(`template.${widgetName}`),
    );

    return clone;
  }

  return clone;
}

/**
 * Purge all paths in a provided widgets' dynamicTriggerPathList and dynamicBindingPathList, which no longer exist in the widget
 * I call these paths orphaned dynamic paths
 *
 * @param widget : WidgetProps
 *
 * returns the updated widget
 */

// Purge all paths in a provided widgets' dynamicTriggerPathList, which don't exist in the widget
export function purgeOrphanedDynamicPaths(widget: WidgetProps) {
  // Attempt to purge only if there are dynamicTriggerPaths in this widget
  if (widget.dynamicTriggerPathList && widget.dynamicTriggerPathList.length) {
    // Filter out all the paths from the dynamicTriggerPathList which don't exist in the widget
    widget.dynamicTriggerPathList = widget.dynamicTriggerPathList.filter(
      (path: DynamicPath) => {
        // Use lodash _.has to check if the path exists in the widget
        return _.has(widget, path.key);
      },
    );
  }
  if (widget.dynamicBindingPathList && widget.dynamicBindingPathList.length) {
    // Filter out all the paths from the dynamicBindingPaths which don't exist in the widget
    widget.dynamicBindingPathList = widget.dynamicBindingPathList.filter(
      (path: DynamicPath) => {
        // Use lodash _.has to check if the path exists in the widget
        return _.has(widget, path.key);
      },
    );
  }
  return widget;
}
