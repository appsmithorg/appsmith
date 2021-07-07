import {
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
  WidgetTypes,
} from "constants/WidgetConstants";
import log from "loglevel";
import { cloneDeep, get, isString, filter, set, minBy, maxBy } from "lodash";
import { GRID_DENSITY_MIGRATION_V1 } from "mockResponses/WidgetConfigResponse";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { select } from "redux-saga/effects";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { generateReactKey } from "utils/generators";
import { getCopiedWidgets } from "utils/storage";
import { WidgetProps } from "widgets/BaseWidget";
import {
  getNextWidgetName,
  calculateNewWidgetPosition,
} from "sagas/WidgetOperationSagas";
import { getSelectedWidget, getWidgetMetaProps, getWidgets } from "./selectors";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";
import { DataTree } from "entities/DataTree/dataTreeFactory";

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
  let root = get(widgets, `${widget.parentId}`);

  while (root && root.parentId && root.widgetId !== MAIN_CONTAINER_WIDGET_ID) {
    if (root.type === WidgetTypes.LIST_WIDGET) {
      const listWidget = root;
      const currentWidget = cloneDeep(widget);
      let template = get(listWidget, "template", {});
      const dynamicBindingPathList: any[] = get(
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
          const { jsSnippets } = getDynamicBindings(value);

          const modifiedAction = jsSnippets.reduce(
            (prev: string, next: string) => {
              return prev + `${next}`;
            },
            "",
          );

          value = `{{${listWidget.widgetName}.listData.map((currentItem) => ${modifiedAction})}}`;

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
  if (widget.type === WidgetTypes.LIST_WIDGET) {
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
  } else if (widget.type === WidgetTypes.MODAL_WIDGET) {
    // if Modal is being coppied handle all onClose action rename
    const oldWidgetName = Object.keys(widgetNameMap).find(
      (key) => widgetNameMap[key] === widget.widgetName,
    );
    // get all the button, icon widgets
    const copiedBtnIcnWidgets = filter(
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
        set(widgets[copyWidget.widgetId], "onClick", newOnClick);
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
  const widget = get(canvasWidgets, widgetId);
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
    if (
      selectedWidget.children &&
      selectedWidget.type !== WidgetTypes.LIST_WIDGET
    ) {
      parentWidget = widgets[selectedWidget.widgetId];
    }
  }

  // If the parent widget in which to paste the copied widget
  // is not the main container and is not a canvas widget
  if (
    parentWidget.widgetId !== MAIN_CONTAINER_WIDGET_ID &&
    parentWidget.type !== WidgetTypes.CANVAS_WIDGET
  ) {
    let childWidget;
    // If the widget in which to paste the new widget is NOT
    // a tabs widget
    if (parentWidget.type !== WidgetTypes.TABS_WIDGET) {
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
    if (childWidget && childWidget.type === WidgetTypes.CANVAS_WIDGET) {
      newWidgetParentId = childWidget.widgetId;
    }
  }
  return newWidgetParentId;
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
    selectedWidget?.type === WidgetTypes.LIST_WIDGET
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

      if (copiedWidget.type === WidgetTypes.LIST_WIDGET) {
        return selectedWidget;
      }
    }

    return get(canvasWidgets, firstChildId);
  }
  return selectedWidget;
};

export function groupWidgetsIntoContainer(
  copiedWidgetGroups: CopiedWidgetGroup[],
): CopiedWidgetGroup[] {
  const containerWidgetId = generateReactKey();
  const columns = 8 * GRID_DENSITY_MIGRATION_V1;
  const rows = 7 * GRID_DENSITY_MIGRATION_V1;
  const widgetName = `Container${containerWidgetId}`;

  const copiedWidgets = copiedWidgetGroups.map((copiedWidgetGroup) =>
    copiedWidgetGroup.list.find(
      (w) => w.widgetId === copiedWidgetGroup.widgetId,
    ),
  );

  const boundary = {
    top: minBy(copiedWidgets, (copiedWidget) => copiedWidget?.topRow),
    left: minBy(copiedWidgets, (copiedWidget) => copiedWidget?.leftColumn),
    bottom: maxBy(copiedWidgets, (copiedWidget) => copiedWidget?.bottomRow),
    right: maxBy(copiedWidgets, (copiedWidget) => copiedWidget?.rightColumn),
  };

  const newCanvasWidget: FlattenedWidgetProps = {
    bottomRow: 400,
    canExtend: false,
    children: [],
    containerStyle: "none",
    detachFromLayout: true,
    isLoading: false,
    isVisible: true,
    leftColumn: 0,
    minHeight: 400,
    parentColumnSpace: 1,
    parentId: "n3ish2fmih",
    parentRowSpace: 1,
    rightColumn: 634,
    topRow: 0,
    type: "CANVAS_WIDGET",
    renderMode: RenderModes.CANVAS,
    version: 1,
    widgetId: generateReactKey(),
    widgetName: `Canvas${generateReactKey()}`,
  };
  const newContainerWidget: FlattenedWidgetProps = {
    parentId: MAIN_CONTAINER_WIDGET_ID,
    widgetName: widgetName,
    type: WidgetTypes.CONTAINER_WIDGET,
    widgetId: containerWidgetId,
    leftColumn: boundary.left?.leftColumn || 0, // calculat
    topRow: boundary.top?.topRow || 0, // calculate this from select
    bottomRow: boundary.bottom?.bottomRow || 0, // calculate this from selected widgets
    rightColumn: boundary.right?.rightColumn || 0, // calculate this from selected widgets
    columns,
    rows,
    tabId: "",
    children: [newCanvasWidget.widgetId],
    renderMode: RenderModes.CANVAS,
    version: 1,
    isLoading: false,
    isVisible: true,
    parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
    parentColumnSpace: 1,
  };

  return [
    {
      list: [newContainerWidget, newCanvasWidget],
      widgetId: newContainerWidget.widgetId,
      parentId: "0",
    },
  ];
}

/**
 * returns the top row of the topmost widget from the array
 * of selected widgets
 *
 * @param copiedWidgetGroups
 * @returns
 */
export const getTopMostSelectedWidget = function(
  copiedWidgetGroups: CopiedWidgetGroup[],
) {
  const sortedWidgetList = copiedWidgetGroups.sort(
    (a, b) => a.list[0].topRow - b.list[0].topRow,
  );
  return sortedWidgetList[0].list[0];
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

  selectedWidget = checkIfPastingIntoListWidget(
    canvasWidgets,
    selectedWidget,
    copiedWidgetGroups,
  );

  return selectedWidget;
};

/**
 * updates the tab id of tabs widget when pasting
 *
 * @param widget
 * @param widgetIdMap
 */
export const updateWidgetIdOfTabsWhenPasting = function(
  widget: WidgetProps & {
    children?: string[] | undefined;
  },
  widgetIdMap: Record<string, string>,
) {
  if (widget.tabsObj && widget.type === WidgetTypes.TABS_WIDGET) {
    try {
      const tabs = Object.values(widget.tabsObj);
      if (Array.isArray(tabs)) {
        widget.tabsObj = tabs.reduce((obj: any, tab) => {
          tab.widgetId = widgetIdMap[tab.widgetId];
          obj[tab.id] = tab;
          return obj;
        }, {});
      }
    } catch (error) {
      log.debug("Error updating tabs", error);
    }
  }
};

/**
 * Updates the table widget column properties
 *
 * @param widget
 * @param widgets
 * @param evalTree
 */
export const updateTableColumnPropertiesWhenPasting = function(
  widget: WidgetProps & {
    children?: string[] | undefined;
  },
  widgets: CanvasWidgetsReduxState,
  evalTree: DataTree,
) {
  if (widget.type === WidgetTypes.TABLE_WIDGET) {
    try {
      const oldWidgetName = widget.widgetName;
      const newWidgetName = getNextWidgetName(widgets, widget.type, evalTree);
      // If the primaryColumns of the table exist
      if (widget.primaryColumns) {
        // For each column
        for (const [columnId, column] of Object.entries(
          widget.primaryColumns,
        )) {
          // For each property in the column
          for (const [key, value] of Object.entries(
            column as ColumnProperties,
          )) {
            // Replace reference of previous widget with the new widgetName
            // This handles binding scenarios like `{{Table2.tableData.map((currentRow) => (currentRow.id))}}`
            widget.primaryColumns[columnId][key] = isString(value)
              ? value.replace(`${oldWidgetName}.`, `${newWidgetName}.`)
              : value;
          }
        }
      }
      // Use the new widget name we used to replace the column properties above.
      widget.widgetName = newWidgetName;
    } catch (error) {
      log.debug("Error updating table widget properties", error);
    }
  }
};

export const updateCopiedWidgetProps = function(
  widget: WidgetProps & {
    children?: string[] | undefined;
  },
  widgets: CanvasWidgetsReduxState,
  pastingIntoWidgetId: string,
  newWidgetPosition: {
    topRow: number;
    bottomRow: number;
    leftColumn: number;
    rightColumn: number;
  },
  isCopiedWidget: boolean,
): CanvasWidgetsReduxState {
  if (isCopiedWidget) {
    const { bottomRow, leftColumn, rightColumn, topRow } = newWidgetPosition;
    widget.leftColumn = leftColumn;
    widget.topRow = topRow;
    widget.bottomRow = bottomRow;
    widget.rightColumn = rightColumn;
    widget.parentId = pastingIntoWidgetId;
    // Also, update the parent widget in the canvas widgets
    // to include this new copied widget's id in the parent's children
    let parentChildren = [widget.widgetId];
    const widgetChildren = widgets[pastingIntoWidgetId].children;
    if (widgetChildren && Array.isArray(widgetChildren)) {
      // Add the new child to existing children
      parentChildren = parentChildren.concat(widgetChildren);
    }
    const updateBottomRow =
      widget.bottomRow * widget.parentRowSpace >
      widgets[pastingIntoWidgetId].bottomRow;
    widgets = {
      ...widgets,
      [pastingIntoWidgetId]: {
        ...widgets[pastingIntoWidgetId],
        ...(updateBottomRow
          ? {
              bottomRow: widget.bottomRow * widget.parentRowSpace,
            }
          : {}),
        children: parentChildren,
      },
    };
    // If the copied widget's boundaries exceed the parent's
    // Make the parent scrollable
    if (
      widgets[pastingIntoWidgetId].bottomRow *
        widgets[widget.parentId].parentRowSpace <=
      widget.bottomRow * widget.parentRowSpace
    ) {
      const parentOfPastingWidget = widgets[pastingIntoWidgetId].parentId;
      if (
        parentOfPastingWidget &&
        widget.parentId !== MAIN_CONTAINER_WIDGET_ID
      ) {
        const parent = widgets[parentOfPastingWidget];
        widgets[parentOfPastingWidget] = {
          ...parent,
          shouldScrollContents: true,
        };
      }
    }
  } else {
    // For all other widgets in the list
    // (These widgets will be descendants of the copied widget)
    // This means, that their parents will also be newly copied widgets
    // Update widget's parent widget ids with the new parent widget ids
    const newParentId = newWidgetList.find((newWidget) =>
      widget.parentId
        ? newWidget.widgetId === widgetIdMap[widget.parentId]
        : false,
    )?.widgetId;
    if (newParentId) widget.parentId = newParentId;
  }

  return widgets;
};
