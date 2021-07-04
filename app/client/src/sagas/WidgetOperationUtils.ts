import {
  MAIN_CONTAINER_WIDGET_ID,
  WidgetTypes,
} from "constants/WidgetConstants";
import { cloneDeep, get, isString, filter, set } from "lodash";
import {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { call, select } from "redux-saga/effects";
import { getDynamicBindings } from "utils/DynamicBindingUtils";
import { getWidget, getWidgetMetaProps } from "./selectors";

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

export function* getWidgetChildren(widgetId: string): any {
  const childrenIds: string[] = [];
  const widget = yield select(getWidget, widgetId);
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
        const grandChildren = yield call(getWidgetChildren, child);
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
    // Select the selected widget if the widget is container like
    if (selectedWidget.children) {
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

export const checkIfPastingIntoListWidget = function*(
  selectedWidget: FlattenedWidgetProps | undefined,
) {
  // when list widget is selected, if the user is pasting, we want it to be pasted in the template
  // which is first children of list widget
  if (
    selectedWidget &&
    selectedWidget.children &&
    selectedWidget?.type === WidgetTypes.LIST_WIDGET
  ) {
    const childrenIds: string[] = yield call(
      getWidgetChildren,
      selectedWidget.children[0],
    );
    const firstChildId = childrenIds[0];

    selectedWidget = yield select(getWidget, firstChildId);
  }
  return selectedWidget;
};
