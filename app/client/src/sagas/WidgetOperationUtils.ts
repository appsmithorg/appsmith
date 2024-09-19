import type { WidgetEntity } from "ee/entities/DataTree/types";
import { isWidget } from "ee/workers/Evaluation/evaluationUtils";
import WidgetFactory from "WidgetProvider/factory";
import { CANVAS_DEFAULT_MIN_HEIGHT_PX } from "constants/AppConstants";
import type {
  OccupiedSpace,
  WidgetSpace,
} from "constants/CanvasEditorConstants";
import type { WidgetType } from "constants/WidgetConstants";
import {
  AUTO_LAYOUT_CONTAINER_PADDING,
  CONTAINER_GRID_PADDING,
  FLEXBOX_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import {
  POSITIONED_WIDGET,
  getBaseWidgetClassName,
  getSlidingArenaName,
  getStickyCanvasName,
} from "constants/componentClassNameConstants";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import {
  getWidgetLayoutMetaInfo,
  type WidgetLayoutPositionInfo,
} from "layoutSystems/anvil/utils/layouts/widgetPositionUtils";
import type { CopiedWidgetData } from "layoutSystems/anvil/utils/paste/types";
import { getWidgetHierarchy } from "layoutSystems/anvil/utils/paste/utils";
import { Positioning } from "layoutSystems/common/utils/constants";
import { LayoutSystemTypes } from "layoutSystems/types";
import _, { find, isString, reduce, remove } from "lodash";
import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import type { MetaState } from "reducers/entityReducers/metaReducer";
import { all, call, select } from "redux-saga/effects";
import { reflow } from "reflow";
import type {
  GridProps,
  PrevReflowState,
  ReflowedSpaceMap,
  SpaceMap,
} from "reflow/reflowTypes";
import { ReflowDirection } from "reflow/reflowTypes";
import { getDataTree } from "selectors/dataTreeSelectors";
import { getContainerWidgetSpacesSelector } from "selectors/editorSelectors";
import { getSelectedWidgets } from "selectors/ui";
import { getNextEntityName } from "utils/AppsmithUtils";
import type { DynamicPath } from "utils/DynamicBindingUtils";
import {
  combineDynamicBindings,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import { areIntersecting } from "utils/boxHelpers";
import { generateReactKey } from "utils/generators";
import { getBottomRowAfterReflow } from "utils/reflowHookUtils";
import { getCopiedWidgets } from "utils/storage";
import type { WidgetProps } from "widgets/BaseWidget";
import { getParentWithEnhancementFn } from "./WidgetEnhancementHelpers";
import {
  getFocusedWidget,
  getSelectedWidget,
  getWidgetMetaProps,
  getWidgets,
} from "./selectors";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";

export interface CopiedWidgetGroup {
  widgetId: string;
  parentId: string;
  list: WidgetProps[];
}

export interface NewPastePositionVariables {
  bottomMostRow?: number;
  gridProps?: GridProps;
  newPastingPositionMap?: SpaceMap;
  reflowedMovementMap?: ReflowedSpaceMap;
  canvasId?: string;
}

export const WIDGET_PASTE_PADDING = 1;

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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // updating dynamicBindingPath in copied widget if the copied widget thas reference to oldWidgetNames
      widget.dynamicBindingPathList = (widget.dynamicBindingPathList || []).map(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // updating dynamicTriggerPath in copied widget if the copied widget thas reference to oldWidgetNames
      widget.dynamicTriggerPathList = (widget.dynamicTriggerPathList || []).map(
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        copyWidget.type === "ICON_WIDGET" ||
        copyWidget.type === "ICON_BUTTON_WIDGET",
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

  widgets = handleListWidgetV2Pasting(widget, widgets, widgetNameMap);

  return widgets;
};
export // TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWidgetChildrenIds(
  canvasWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const grandChildren = getWidgetChildrenIds(canvasWidgets, child);

        if (grandChildren.length) {
          childrenIds.push(...grandChildren);
        }
      }
    }
  }

  return childrenIds;
}

function sortWidgetsMetaByParent(widgetsMeta: MetaState, parentId: string) {
  return reduce(
    widgetsMeta,
    function (
      result: {
        childrenWidgetsMeta: MetaState;
        otherWidgetsMeta: MetaState;
      },
      currentWidgetMeta,
      key,
    ) {
      return key.startsWith(parentId + "_")
        ? {
            ...result,
            childrenWidgetsMeta: {
              ...result.childrenWidgetsMeta,
              [key]: currentWidgetMeta,
            },
          }
        : {
            ...result,
            otherWidgetsMeta: {
              ...result.otherWidgetsMeta,
              [key]: currentWidgetMeta,
            },
          };
    },
    {
      childrenWidgetsMeta: {},
      otherWidgetsMeta: {},
    },
  );
}

export interface DescendantWidgetMap {
  id: string;
  // To accomodate metaWidgets which might not be present on the evalTree, evaluatedWidget might be undefined
  evaluatedWidget: WidgetEntity | undefined;
}

/**
 * As part of widget's descendant, we add both children and metaWidgets.
 * children are assessed from "widget.children"
 * metaWidgets are assessed from the metaState, since we care about only metawidgets whose values have been changed.
 * NB: metaWidgets id start with parentId + "_"
 */
export function getWidgetDescendantToReset(
  canvasWidgets: CanvasWidgetsReduxState,
  widgetId: string,
  evaluatedDataTree: DataTree,
  widgetsMeta: MetaState,
): DescendantWidgetMap[] {
  const descendantList: DescendantWidgetMap[] = [];
  const widget = _.get(canvasWidgets, widgetId);

  const sortedWidgetsMeta = sortWidgetsMetaByParent(widgetsMeta, widgetId);

  for (const childMetaWidgetId of Object.keys(
    sortedWidgetsMeta.childrenWidgetsMeta,
  )) {
    const evaluatedChildWidget = find(evaluatedDataTree, function (entity) {
      return isWidget(entity) && entity.widgetId === childMetaWidgetId;
    }) as WidgetEntity | undefined;

    descendantList.push({
      id: childMetaWidgetId,
      evaluatedWidget: evaluatedChildWidget,
    });
    const grandChildren = getWidgetDescendantToReset(
      canvasWidgets,
      childMetaWidgetId,
      evaluatedDataTree,
      sortedWidgetsMeta.otherWidgetsMeta,
    );

    if (grandChildren.length) {
      descendantList.push(...grandChildren);
    }
  }

  if (widget) {
    const { children = [] } = widget;

    if (children && children.length) {
      for (const childIndex in children) {
        if (children.hasOwnProperty(childIndex)) {
          const childWidgetId = children[childIndex];

          const childCanvasWidget = _.get(canvasWidgets, childWidgetId);
          const childWidgetName = childCanvasWidget.widgetName;
          const childWidget = evaluatedDataTree[childWidgetName];

          if (isWidget(childWidget)) {
            descendantList.push({
              id: childWidgetId,
              evaluatedWidget: childWidget as WidgetEntity,
            });
            const grandChildren = getWidgetDescendantToReset(
              canvasWidgets,
              childWidgetId,
              evaluatedDataTree,
              sortedWidgetsMeta.otherWidgetsMeta,
            );

            if (grandChildren.length) {
              descendantList.push(...grandChildren);
            }
          }
        }
      }
    }
  }

  return descendantList;
}

export const getParentWidgetIdForPasting = function* (
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
      selectedWidget.type !== "LIST_WIDGET" &&
      selectedWidget.type !== "LIST_WIDGET_V2"
    ) {
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
        parentWidget,
      );

      if (selectedTabWidgetId) childWidget = widgets[selectedTabWidgetId];
    }

    // If the finally selected parent in which to paste the widget
    // is a CANVAS_WIDGET, use its widgetId as the new widget's parent Id
    if (childWidget && childWidget.type === "CANVAS_WIDGET") {
      newWidgetParentId = childWidget.widgetId;
    }
  } else if (selectedWidget && selectedWidget.type === "CANVAS_WIDGET") {
    newWidgetParentId = selectedWidget.widgetId;
  }

  return newWidgetParentId;
};

export const getSelectedWidgetIfPastingIntoListWidget = function (
  canvasWidgets: CanvasWidgetsReduxState,
  selectedWidget: FlattenedWidgetProps | undefined,
  copiedWidgets: CopiedWidgetGroup[],
) {
  // when list widget is selected, if the user is pasting, we want it to be pasted in the template
  // which is first children of list widget
  if (
    selectedWidget &&
    selectedWidget.children &&
    selectedWidget?.type === "LIST_WIDGET"
  ) {
    const childrenIds: string[] = getWidgetChildrenIds(
      canvasWidgets,
      selectedWidget.children[0],
    );
    const firstChildId = childrenIds[0];

    // if any copiedWidget is a list widget, we will paste into the parent of list widget
    for (let i = 0; i < copiedWidgets.length; i++) {
      const copiedWidget = copiedWidgets[i].list[0];

      if (copiedWidget?.type === "LIST_WIDGET") {
        return selectedWidget;
      }
    }

    return _.get(canvasWidgets, firstChildId);
  }

  return selectedWidget;
};

/**
 * get selected widgets that are verified to make sure that we are not pasting list widget onto another list widget
 * also return a boolean to indicate if the list widget is pasting into a list widget
 *
 * @param selectedWidgetIDs
 * @param copiedWidgetGroups
 * @param canvasWidgets
 * @returns
 */
export function getVerifiedSelectedWidgets(
  selectedWidgetIDs: string[],
  copiedWidgetGroups: CopiedWidgetGroup[],
  canvasWidgets: CanvasWidgetsReduxState,
) {
  const selectedWidgets = getWidgetsFromIds(selectedWidgetIDs, canvasWidgets);

  //if there is no list widget in the copied widgets then return selected Widgets
  if (
    !checkForListWidgetInCopiedWidgets(copiedWidgetGroups) ||
    selectedWidgets.length === 0
  )
    return { selectedWidgets };

  //if the selected widget is a list widgets the return isListWidgetPastingOnItself as true
  if (selectedWidgets.length === 1 && selectedWidgets[0].type === "LIST_WIDGET")
    return { selectedWidgets, isListWidgetPastingOnItself: true };

  //get list widget ancestor of selected widget if it has a list widget ancestor
  const parentListWidgetId = document
    .querySelector(
      `.${POSITIONED_WIDGET}.${getBaseWidgetClassName(
        selectedWidgets[0].widgetId,
      )}`,
    )
    ?.closest(".t--widget-listwidget")?.id;

  //if the selected widgets do have a list widget ancestor then,
  // return that list widget as selected widgets and isListWidgetPastingOnItself as true
  if (parentListWidgetId && canvasWidgets[parentListWidgetId])
    return {
      selectedWidgets: [canvasWidgets[parentListWidgetId]],
      isListWidgetPastingOnItself: true,
    };

  return { selectedWidgets };
}

/**
 * returns true if list widget is among the copied widgets
 *
 * @param copiedWidgetGroups
 * @returns boolean
 */
export function checkForListWidgetInCopiedWidgets(
  copiedWidgetGroups: CopiedWidgetGroup[],
) {
  for (let i = 0; i < copiedWidgetGroups.length; i++) {
    const copiedWidget = copiedWidgetGroups[i].list[0];

    if (copiedWidget?.type === "LIST_WIDGET") {
      return true;
    }
  }

  return false;
}

/**
 * get top, left, right, bottom most widgets and totalWidth from copied groups when pasting
 *
 * @param copiedWidgetGroups
 * @returns
 */
export const getBoundaryWidgetsFromCopiedGroups = function (
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
    totalWidth: rightMostWidget.rightColumn - leftMostWidget.leftColumn,
  };
};

/**
 * get totalWidth, maxThickness, topMostRow and leftMostColumn from selected Widgets
 *
 * @param selectedWidgets
 * @returns
 */
export function getBoundariesFromSelectedWidgets(
  selectedWidgets: WidgetProps[],
) {
  const topMostWidget = selectedWidgets.sort((a, b) => a.topRow - b.topRow)[0];
  const leftMostWidget = selectedWidgets.sort(
    (a, b) => a.leftColumn - b.leftColumn,
  )[0];
  const rightMostWidget = selectedWidgets.sort(
    (a, b) => b.rightColumn - a.rightColumn,
  )[0];
  const bottomMostWidget = selectedWidgets.sort(
    (a, b) => b.bottomRow - a.bottomRow,
  )[0];
  const thickestWidget = selectedWidgets.sort(
    (a, b) => b.bottomRow - b.topRow - a.bottomRow + a.topRow,
  )[0];

  return {
    totalWidth: rightMostWidget.rightColumn - leftMostWidget.leftColumn,
    totalHeight: bottomMostWidget.bottomRow - topMostWidget.topRow,
    maxThickness: thickestWidget.bottomRow - thickestWidget.topRow,
    topMostRow: topMostWidget.topRow,
    leftMostColumn: leftMostWidget.leftColumn,
  };
}

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
export const getSelectedWidgetWhenPasting = function* () {
  const canvasWidgets: CanvasWidgetsReduxState = yield select(getWidgets);
  const { widgets: copiedWidgetGroups }: { widgets: CopiedWidgetGroup[] } =
    yield getCopiedWidgets();

  let selectedWidget: FlattenedWidgetProps | undefined =
    yield select(getSelectedWidget);

  const focusedWidget: FlattenedWidgetProps | undefined =
    yield select(getFocusedWidget);

  selectedWidget = getSelectedWidgetIfPastingIntoListWidget(
    canvasWidgets,
    selectedWidget || focusedWidget,
    copiedWidgetGroups,
  );

  return selectedWidget;
};

function getStickyCanvasDOM(canvasId: string) {
  // get DOM of the overall canvas including it's total scroll height
  const stickyCanvasDOM = document.querySelector(
    `#${getSlidingArenaName(canvasId)}`,
  );

  return stickyCanvasDOM;
}

/**
 * calculates mouse positions in terms of grid values
 *
 * @param canvasRect canvas DOM rect
 * @param canvasId Id of the canvas widget
 * @param snapGrid grid parameters
 * @param padding padding inside of widget
 * @param mouseLocation mouse Location in terms of absolute pixel values
 * @returns
 */
export function getMousePositions(
  canvasRect: DOMRect,
  canvasId: string,
  snapGrid: { snapRowSpace: number; snapColumnSpace: number },
  padding: number,
  mouseLocation?: { x: number; y: number },
) {
  //check if the mouse location is inside of the container widget
  if (
    !mouseLocation ||
    !(
      canvasRect.top < mouseLocation.y &&
      canvasRect.left < mouseLocation.x &&
      canvasRect.bottom > mouseLocation.y &&
      canvasRect.right > mouseLocation.x
    )
  )
    return;

  const stickyCanvasDOM = getStickyCanvasDOM(canvasId);

  if (!stickyCanvasDOM) return;

  const rect = stickyCanvasDOM.getBoundingClientRect();

  // get mouse position relative to the canvas.
  const relativeMouseLocation = {
    y: mouseLocation.y - rect.top - padding,
    x: mouseLocation.x - rect.left - padding,
  };

  return {
    top: Math.floor(relativeMouseLocation.y / snapGrid.snapRowSpace),
    left: Math.floor(relativeMouseLocation.x / snapGrid.snapColumnSpace),
  };
}

/**
 * This method calculates the snap Grid dimensions.
 *
 * @param LayoutWidget
 * @param canvasWidth
 * @returns
 */
export function getSnappedGrid(LayoutWidget: WidgetProps, canvasWidth: number) {
  // For all widgets inside a container, we remove both container padding as well as widget padding from component width
  let padding =
    ((LayoutWidget?.layoutSystemType === LayoutSystemTypes.AUTO
      ? AUTO_LAYOUT_CONTAINER_PADDING
      : CONTAINER_GRID_PADDING) +
      WIDGET_PADDING) *
    2;

  if (
    LayoutWidget.widgetId === MAIN_CONTAINER_WIDGET_ID ||
    LayoutWidget.type === "CONTAINER_WIDGET"
  ) {
    // For MainContainer and any Container Widget padding doesn't exist coz there is already container padding.
    padding =
      LayoutWidget.positioning === Positioning.Vertical
        ? FLEXBOX_PADDING * 2
        : CONTAINER_GRID_PADDING * 2;
  }

  if (LayoutWidget.noPad) {
    // Widgets like ListWidget choose to have no container padding so will only have widget padding
    padding = WIDGET_PADDING * 2;
  }

  const width = canvasWidth - padding;

  return {
    snapGrid: {
      snapRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      snapColumnSpace: canvasWidth
        ? width / GridDefaults.DEFAULT_GRID_COLUMNS
        : 0,
    },
    padding: padding / 2,
  };
}

/**
 * method to return default canvas,
 * It is MAIN_CONTAINER_WIDGET_ID by default or
 * if a modal is open, then default canvas is a Modal's canvas
 *
 * @param canvasWidgets
 * @returns
 */
export function getDefaultCanvas(canvasWidgets: CanvasWidgetsReduxState) {
  const containerDOM = document.querySelector(".t--modal-widget");

  //if a modal is open, then get it's canvas Id
  if (containerDOM && containerDOM.id && canvasWidgets[containerDOM.id]) {
    const containerWidget = canvasWidgets[containerDOM.id];
    const { canvasDOM, canvasId } = getCanvasIdForContainer(containerWidget);

    return {
      canvasId,
      canvasDOM,
      containerWidget,
    };
  } else {
    //default canvas is set as MAIN_CONTAINER_WIDGET_ID
    return {
      canvasId: MAIN_CONTAINER_WIDGET_ID,
      containerWidget: canvasWidgets[MAIN_CONTAINER_WIDGET_ID],
      canvasDOM: document.querySelector(
        `#${getSlidingArenaName(MAIN_CONTAINER_WIDGET_ID)}`,
      ),
    };
  }
}

/**
 * This method returns the Id of the parent widget of the canvas widget
 *
 * @param canvasId
 * @returns
 */
export function getContainerIdForCanvas(canvasId: string): string | undefined {
  if (canvasId === MAIN_CONTAINER_WIDGET_ID) return canvasId;

  const selector = `#${getStickyCanvasName(canvasId)}`;
  const canvasDOM = document.querySelector(selector);

  if (!canvasDOM) return undefined;

  //check for positionedWidget parent
  let containerDOM = canvasDOM.closest(`.${POSITIONED_WIDGET}`);

  //if positioned widget parent is not found, most likely is a modal widget
  if (!containerDOM) containerDOM = canvasDOM.closest(".t--modal-widget");

  return containerDOM ? containerDOM.id : "";
}

/**
 * This method returns Id of the child canvas inside of the Layout Widget
 *
 * @param layoutWidget
 * @returns
 */
export function getCanvasIdForContainer(layoutWidget: WidgetProps) {
  const selector =
    layoutWidget.type === "MODAL_WIDGET"
      ? `.${getBaseWidgetClassName(layoutWidget.widgetId)}`
      : `.${POSITIONED_WIDGET}.${getBaseWidgetClassName(
          layoutWidget.widgetId,
        )}`;
  const containerDOM = document.querySelector(selector);

  if (!containerDOM) return {};

  const dropTargetDOM = containerDOM.querySelector(".t--drop-target");
  const canvasDOM = containerDOM.getElementsByTagName("canvas");

  return {
    canvasId: canvasDOM ? canvasDOM[0].id.split("-")[2] : undefined,
    canvasDOM: dropTargetDOM,
  };
}

/**
 * This method returns array of occupiedSpaces with changes Ids
 *
 * @param newPastingPositionMap
 * @returns
 */
export function changeIdsOfPastePositions(newPastingPositionMap: SpaceMap) {
  const newPastePositions = [];
  const newPastingPositionArray = Object.values(newPastingPositionMap);
  let count = 1;

  for (const position of newPastingPositionArray) {
    newPastePositions.push({
      ...position,
      id: count.toString(),
    });
    count++;
  }

  return newPastePositions;
}

/**
 * Iterates over the selected widgets to find the next available space below the selected widgets
 * where in the new pasting positions dont overlap with the selected widgets
 *
 * @param copiedSpaces
 * @param selectedSpaces
 * @param thickness
 * @returns
 */
export function getVerticallyAdjustedPositions(
  copiedSpaces: OccupiedSpace[],
  selectedSpaces: OccupiedSpace[],
  thickness: number,
) {
  let verticalOffset = thickness;

  const newPastingPositionMap: SpaceMap = {};

  //iterate over the widgets to calculate verticalOffset
  //TODO: find a better way to do this.
  for (let i = 0; i < copiedSpaces.length; i++) {
    const copiedSpace = {
      ...copiedSpaces[i],
      top: copiedSpaces[i].top + verticalOffset,
      bottom: copiedSpaces[i].bottom + verticalOffset,
    };

    for (let j = 0; j < selectedSpaces.length; j++) {
      const selectedSpace = selectedSpaces[j];

      if (areIntersecting(copiedSpace, selectedSpace)) {
        const increment = selectedSpace.bottom - copiedSpace.top;

        if (increment > 0) {
          verticalOffset += increment;
          i = 0;
          j = 0;
          break;
        } else return;
      }
    }
  }

  verticalOffset += WIDGET_PASTE_PADDING;

  // offset the pasting positions down
  for (const copiedSpace of copiedSpaces) {
    newPastingPositionMap[copiedSpace.id] = {
      ...copiedSpace,
      top: copiedSpace.top + verticalOffset,
      bottom: copiedSpace.bottom + verticalOffset,
    };
  }

  return newPastingPositionMap;
}

/**
 * Simple method to convert widget props to occupied spaces
 *
 * @param widgets
 * @returns
 */
export function getOccupiedSpacesFromProps(
  widgets: WidgetProps[],
): OccupiedSpace[] {
  const occupiedSpaces = [];

  for (const widget of widgets) {
    const currentSpace = {
      id: widget.widgetId,
      top: widget.topRow,
      left: widget.leftColumn,
      bottom: widget.bottomRow,
      right: widget.rightColumn,
    } as OccupiedSpace;

    occupiedSpaces.push(currentSpace);
  }

  return occupiedSpaces;
}

/**
 * Method that adjusts the positions of copied spaces using,
 * the top-left of copied widgets and top left of where it should be placed
 *
 * @param copiedWidgetGroups
 * @param copiedTopMostRow
 * @param selectedTopMostRow
 * @param copiedLeftMostColumn
 * @param pasteLeftMostColumn
 * @returns
 */
export function getNewPositionsForCopiedWidgets(
  copiedWidgetGroups: CopiedWidgetGroup[],
  copiedTopMostRow: number,
  selectedTopMostRow: number,
  copiedLeftMostColumn: number,
  pasteLeftMostColumn: number,
): OccupiedSpace[] {
  const copiedSpacePositions = [];

  // the logic is that, when subtracted by top-left of copied widget, the new position's top-left will be zero
  // by adding the selectedTopMostRow or pasteLeftMostColumn, copied widget's top row is aligned there

  const leftOffSet = copiedLeftMostColumn - pasteLeftMostColumn;
  const topOffSet = copiedTopMostRow - selectedTopMostRow;

  for (const copiedWidgetGroup of copiedWidgetGroups) {
    const copiedWidget = copiedWidgetGroup.list[0];

    const currentSpace = {
      id: copiedWidgetGroup.widgetId,
      top: copiedWidget.topRow - topOffSet,
      left: copiedWidget.leftColumn - leftOffSet,
      bottom: copiedWidget.bottomRow - topOffSet,
      right: copiedWidget.rightColumn - leftOffSet,
    } as OccupiedSpace;

    copiedSpacePositions.push(currentSpace);
  }

  return copiedSpacePositions;
}

/**
 * Method that adjusts the positions of copied spaces using,
 * the top-left of copied widgets and top left of where it should be placed
 *
 * @param copiedWidgetGroups
 * @param copiedTopMostRow
 * @param mouseTopRow
 * @param copiedLeftMostColumn
 * @param mouseLeftColumn
 * @returns
 */
export function getPastePositionMapFromMousePointer(
  copiedWidgetGroups: CopiedWidgetGroup[],
  copiedTopMostRow: number,
  mouseTopRow: number,
  copiedLeftMostColumn: number,
  mouseLeftColumn: number,
): SpaceMap {
  const newPastingPositionMap: SpaceMap = {};

  // the logic is that, when subtracted by top-left of copied widget, the new position's top-left will be zero
  // by adding the selectedTopMostRow or pasteLeftMostColumn, copied widget's top row is aligned there

  const leftOffSet = copiedLeftMostColumn - mouseLeftColumn;
  const topOffSet = copiedTopMostRow - mouseTopRow;

  for (const copiedWidgetGroup of copiedWidgetGroups) {
    const copiedWidget = copiedWidgetGroup.list[0];

    newPastingPositionMap[copiedWidgetGroup.widgetId] = {
      id: copiedWidgetGroup.widgetId,
      top: copiedWidget.topRow - topOffSet,
      left: copiedWidget.leftColumn - leftOffSet,
      bottom: copiedWidget.bottomRow - topOffSet,
      right: copiedWidget.rightColumn - leftOffSet,
      type: copiedWidget.type,
    } as OccupiedSpace;
  }

  return newPastingPositionMap;
}

/**
 * Take the canvas widgets and move them with the reflowed values
 *
 *
 * @param widgets
 * @param gridProps
 * @param reflowingWidgets
 * @returns
 */
export function getReflowedPositions(
  widgets: {
    [widgetId: string]: FlattenedWidgetProps;
  },
  gridProps?: GridProps,
  reflowingWidgets?: ReflowedSpaceMap,
) {
  const currentWidgets: {
    [widgetId: string]: FlattenedWidgetProps;
  } = { ...widgets };

  const reflowWidgetKeys = Object.keys(reflowingWidgets || {});

  // if there are no reflowed widgets return the original widgets
  if (!reflowingWidgets || !gridProps || reflowWidgetKeys.length <= 0)
    return widgets;

  for (const reflowedWidgetId of reflowWidgetKeys) {
    const reflowWidget = reflowingWidgets[reflowedWidgetId];
    const canvasWidget = { ...currentWidgets[reflowedWidgetId] };

    let { bottomRow, leftColumn, rightColumn, topRow } = canvasWidget;

    // adjust the positions with respect to the reflowed positions
    if (reflowWidget.X !== undefined && reflowWidget.width !== undefined) {
      leftColumn = Math.round(
        canvasWidget.leftColumn + reflowWidget.X / gridProps.parentColumnSpace,
      );
      rightColumn = Math.round(
        leftColumn + reflowWidget.width / gridProps.parentColumnSpace,
      );
    }

    if (reflowWidget.Y !== undefined && reflowWidget.height !== undefined) {
      topRow = Math.round(
        canvasWidget.topRow + reflowWidget.Y / gridProps.parentRowSpace,
      );
      bottomRow = Math.round(
        topRow + reflowWidget.height / gridProps.parentRowSpace,
      );
    }

    currentWidgets[reflowedWidgetId] = {
      ...canvasWidget,
      topRow,
      leftColumn,
      bottomRow,
      rightColumn,
    };
  }

  return currentWidgets;
}

/**
 * method to return array of widget properties from widgetsIds, without any undefined values
 *
 * @param widgetsIds
 * @param canvasWidgets
 * @returns array of widgets properties
 */
export function getWidgetsFromIds(
  widgetsIds: string[],
  canvasWidgets: CanvasWidgetsReduxState,
) {
  const widgets = [];

  for (const currentId of widgetsIds) {
    if (canvasWidgets[currentId]) widgets.push(canvasWidgets[currentId]);
  }

  return widgets;
}

/**
 * Check if it is drop target Including the CANVAS_WIDGET
 *
 * @param type
 * @returns
 */
export function isDropTarget(type: WidgetType, includeCanvasWidget = false) {
  const isLayoutWidget = !!WidgetFactory.widgetConfigMap.get(type)?.isCanvas;

  if (includeCanvasWidget) return isLayoutWidget || type === "CANVAS_WIDGET";

  return isLayoutWidget;
}

/**
 * group copied widgets into a container
 *
 * @param copiedWidgetGroups
 * @param pastingIntoWidgetId
 * @returns
 */
export const groupWidgetsIntoContainer = function* (
  copiedWidgetGroups: CopiedWidgetGroup[],
  pastingIntoWidgetId: string,
  isThereACollision: boolean,
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
  let reflowedMovementMap, bottomMostRow, gridProps;
  const { bottomMostWidget, leftMostWidget, rightMostWidget, topMostWidget } =
    getBoundaryWidgetsFromCopiedGroups(copiedWidgetGroups);

  const copiedWidgets = copiedWidgetGroups.map((copiedWidgetGroup) =>
    copiedWidgetGroup.list.find(
      (w) => w.widgetId === copiedWidgetGroup.widgetId,
    ),
  );

  //calculating parentColumnSpace because the values stored inside widget DSL are not entirely reliable
  const parentColumnSpace =
    getParentColumnSpace(canvasWidgets, pastingIntoWidgetId) ||
    copiedWidgetGroups[0].list[0].parentColumnSpace ||
    1;

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

  // if there are no collision already then reflow the below widgets by 2 rows.
  if (!isThereACollision) {
    const widgetSpacesSelector =
      getContainerWidgetSpacesSelector(pastingIntoWidgetId);
    const widgetSpaces: WidgetSpace[] = yield select(widgetSpacesSelector) ||
      [];

    const copiedWidgetIds = copiedWidgets
      .map((widget) => widget?.widgetId)
      .filter((id) => !!id);

    // filter out copiedWidgets from occupied spaces
    const widgetOccupiedSpaces = widgetSpaces.filter(
      (widgetSpace) => copiedWidgetIds.indexOf(widgetSpace.id) === -1,
    );

    // create the object of the new container in the form of OccupiedSpace
    const containerSpace = {
      id: "1",
      left: newContainerWidget.leftColumn,
      top: newContainerWidget.topRow,
      right: newContainerWidget.rightColumn,
      bottom: newContainerWidget.bottomRow,
    };

    gridProps = {
      parentColumnSpace,
      parentRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      maxGridColumns: GridDefaults.DEFAULT_GRID_COLUMNS,
    };

    //get movement map of reflowed widgets
    const { movementMap } = reflow(
      [containerSpace],
      [containerSpace],
      widgetOccupiedSpaces,
      ReflowDirection.BOTTOM,
      gridProps,
      true,
      false,
      { prevSpacesMap: {} } as PrevReflowState,
    );

    reflowedMovementMap = movementMap;

    //get the new calculated bottom row
    bottomMostRow = getBottomRowAfterReflow(
      reflowedMovementMap,
      containerSpace.bottom,
      widgetOccupiedSpaces,
      gridProps,
    );
  }

  return {
    reflowedMovementMap,
    bottomMostRow,
    gridProps,
    copiedWidgetGroups: [
      {
        list: [newContainerWidget, newCanvasWidget, ...flatList],
        widgetId: newContainerWidget.widgetId,
        parentId: pastingIntoWidgetId,
      },
    ],
  };
};

/**
 * create copiedWidgets objects from selected widgets
 *
 * @returns
 */
export const createSelectedWidgetsAsCopiedWidgets = function* () {
  const canvasWidgets: {
    [widgetId: string]: FlattenedWidgetProps;
  } = yield select(getWidgets);
  const selectedWidgetIDs: string[] = yield select(getSelectedWidgets);
  const selectedWidgets = selectedWidgetIDs.map((each) => canvasWidgets[each]);

  if (!selectedWidgets || !selectedWidgets.length) return;

  const widgetListsToStore: CopiedWidgetData[] = yield all(
    selectedWidgets.map((each) => call(createWidgetCopy, each)),
  );

  return widgetListsToStore;
};

/**
 * return canvasWidgets without selectedWidgets and remove the selected widgets
 * ids in the children of parent widget
 *
 * @return
 */
export const filterOutSelectedWidgets = function* (
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
export const isSelectedWidgetsColliding = function* (
  widgets: CanvasWidgetsReduxState,
  copiedWidgetGroups: CopiedWidgetGroup[],
  pastingIntoWidgetId: string,
) {
  if (!copiedWidgetGroups.length) return false;

  const { bottomMostWidget, leftMostWidget, rightMostWidget, topMostWidget } =
    getBoundaryWidgetsFromCopiedGroups(copiedWidgetGroups);

  const widgetsWithSameParent = _.omitBy(widgets, (widget) => {
    return widget.parentId !== pastingIntoWidgetId;
  });

  const widgetsArray = Object.values(widgetsWithSameParent).filter(
    (widget) =>
      widget.parentId === pastingIntoWidgetId && widget.type !== "MODAL_WIDGET",
  );

  for (let i = 0; i < widgetsArray.length; i++) {
    const widget = widgetsArray[i];

    if (
      !(
        widget.leftColumn >= rightMostWidget.rightColumn ||
        widget.rightColumn <= leftMostWidget.leftColumn ||
        widget.topRow >= bottomMostWidget.bottomRow ||
        widget.bottomRow <= topMostWidget.topRow
      )
    )
      return true;
  }

  return false;
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const allWidgets: { [widgetId: string]: FlattenedWidgetProps } =
    yield select(getWidgets);
  const isAnvilLayout: boolean = yield select(getIsAnvilLayout);
  const widgetsToStore = getAllWidgetsInTree(widget.widgetId, allWidgets);
  let widgetPositionInfo: WidgetLayoutPositionInfo | null = null;

  if (widget.parentId && isAnvilLayout) {
    widgetPositionInfo = getWidgetLayoutMetaInfo(
      allWidgets[widget?.parentId]?.layout[0] ?? null,
      widget.widgetId,
    );
  }

  return {
    hierarchy: getWidgetHierarchy(widget.type, widget.widgetId),
    list: widgetsToStore,
    parentId: widget.parentId,
    widgetId: widget.widgetId,
    widgetPositionInfo,
  };
}

export type WidgetsInTree = (WidgetProps & {
  children?: string[] | undefined;
})[];

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
): WidgetsInTree => {
  const widget = canvasWidgets[widgetId];
  const widgetList = [widget];

  if (widget && widget.children) {
    widget.children
      .filter(Boolean)
      .forEach((childWidgetId: string) =>
        widgetList.push(...getAllWidgetsInTree(childWidgetId, canvasWidgets)),
      );
  }

  return widgetList.filter(Boolean);
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
) {
  const pastingIntoWidgetId = copiedWidgetGroups[0]?.parentId;
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remove(listWidget?.dynamicBindingPathList || [], (path: any) =>
      path.key.startsWith(`template.${widgetName}`),
    );

    // delete dynamic trigger path if any
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 *
 * @param canvasWidgets
 * @param pastingIntoWidgetId
 * @returns
 */
export function getParentColumnSpace(
  canvasWidgets: CanvasWidgetsReduxState,
  pastingIntoWidgetId: string,
) {
  const containerId = getContainerIdForCanvas(pastingIntoWidgetId);

  if (containerId === undefined) return;

  const containerWidget = canvasWidgets[containerId];
  const canvasDOM = document.querySelector(
    `#${getStickyCanvasName(pastingIntoWidgetId)}`,
  );

  if (!canvasDOM || !containerWidget) return;

  const rect = canvasDOM.getBoundingClientRect();

  // get Grid values such as snapRowSpace and snapColumnSpace
  const { snapGrid } = getSnappedGrid(containerWidget, rect.width);

  return snapGrid?.snapColumnSpace;
}

/*
 * Function to extend the lodash's get function to check
 * paths which have dots in it's key
 *
 * Suppose, if the path is `path1.path2.path3.path4`, this function
 * checks in following paths in the tree as well, if _.get doesn't return a value
 *  - path1.path2.path3 -> path4
 *  - path1.path2 -> path3.path4 (will recursively traverse with same logic)
 *  - path1 -> path2.path3.path4 (will recursively traverse with same logic)
 */
export function getValueFromTree(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: unknown,
): unknown {
  // Creating a symbol as we need a unique value that will not be present in the input obj
  const defaultValueSymbol = Symbol("defaultValue");

  //Call the original get function with defaultValueSymbol.
  const value = _.get(obj, path, defaultValueSymbol);

  /*
   * if the value returned by get matches defaultValueSymbol,
   * path is invalid.
   */
  if (value === defaultValueSymbol && path.includes(".")) {
    const pathArray = path.split(".");
    const poppedPath: Array<string> = [];

    while (pathArray.length) {
      const currentPath = pathArray.join(".");

      if (obj.hasOwnProperty(currentPath)) {
        const currentValue = obj[currentPath];

        if (!poppedPath.length) {
          //Valid path
          return currentValue;
        } else if (typeof currentValue !== "object") {
          //Invalid path
          return defaultValue;
        } else {
          //Valid path, need to traverse recursively with same strategy
          return getValueFromTree(
            currentValue as Record<string, unknown>,
            poppedPath.join("."),
            defaultValue,
          );
        }
      } else {
        // We need the popped paths to traverse recursively
        poppedPath.unshift(pathArray.pop() || "");
      }
    }
  }

  // Need to return the defaultValue, if there is no match for the path in the tree
  return value !== defaultValueSymbol ? value : defaultValue;
}

/*
 * Function to merge two dynamicpath arrays
 */
export function mergeDynamicPropertyPaths(
  a?: DynamicPath[],
  b?: DynamicPath[],
) {
  return _.unionWith(a, b, (a, b) => a.key === b.key);
}

/**
 * Note: Mutates widgets[0].bottomRow for CANVAS_WIDGET
 * @param widgets
 * @param parentId
 */
export function resizePublishedMainCanvasToLowestWidget(
  widgets: CanvasWidgetsReduxState,
) {
  if (!widgets[MAIN_CONTAINER_WIDGET_ID]) {
    return;
  }

  const childIds = widgets[MAIN_CONTAINER_WIDGET_ID].children || [];

  let lowestBottomRow = 0;

  // find the lowest row
  childIds.forEach((cId) => {
    const child = widgets[cId];

    if (!child.detachFromLayout && child.bottomRow > lowestBottomRow) {
      lowestBottomRow = child.bottomRow;
    }
  });

  widgets[MAIN_CONTAINER_WIDGET_ID].bottomRow = Math.max(
    CANVAS_DEFAULT_MIN_HEIGHT_PX,
    (lowestBottomRow + GridDefaults.VIEW_MODE_MAIN_CANVAS_EXTENSION_OFFSET) *
      GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
  );
}

export const handleListWidgetV2Pasting = (
  widget: FlattenedWidgetProps,
  widgets: CanvasWidgetsReduxState,
  widgetNameMap: Record<string, string>,
) => {
  if (widget?.type !== "LIST_WIDGET_V2") return widgets;

  widgets = updateListWidgetBindings(widgetNameMap, widgets, widget.widgetId);

  return widgets;
};

// Updating PrimaryKeys, mainCanvasId and mainContainerId for ListWidgetV2
const updateListWidgetBindings = (
  widgetNameMap: Record<string, string>,
  widgets: CanvasWidgetsReduxState,
  listWidgetId: string,
) => {
  let mainCanvasId = "";
  let mainContainerId = "";
  const oldWidgetName =
    Object.keys(widgetNameMap).find(
      (widgetName) =>
        widgetNameMap[widgetName] === widgets[listWidgetId].widgetName,
    ) ?? "";

  Object.keys(widgets).forEach((widgetId) => {
    if (widgets[widgetId].parentId === listWidgetId) {
      mainCanvasId = widgetId;
      mainContainerId = widgets[widgetId].children?.[0] ?? "";
    }
  });

  widgets[listWidgetId].mainCanvasId = mainCanvasId;
  widgets[listWidgetId].mainContainerId = mainContainerId;
  const primaryKeys = widgets[listWidgetId].primaryKeys.replaceAll(
    oldWidgetName,
    widgets[listWidgetId].widgetName,
  );

  widgets[listWidgetId].primaryKeys = primaryKeys;

  return widgets;
};

/**
 * A function to check if paste of widgets can work without conflicts by checking the source and target layout systems
 * @param sourceLayoutSystem The layout system from which the widgets to be pasted were copied/cut
 * @param targetLayoutSystem The layout system to which the copied/cut widgets are pasted
 * @returns boolean: Is there a conflict?
 */
export function isLayoutSystemConflictingForPaste(
  targetLayoutSystem: LayoutSystemTypes,
  sourceLayoutSystem?: LayoutSystemTypes,
) {
  // If source is not ANVIL and the target is ANVIL, we will have a conflict
  if (
    sourceLayoutSystem !== LayoutSystemTypes.ANVIL &&
    targetLayoutSystem === LayoutSystemTypes.ANVIL
  ) {
    return true;
  }

  // If source is ANVIL and target is not ANVIL, we will have a conflict
  if (
    sourceLayoutSystem === LayoutSystemTypes.ANVIL &&
    targetLayoutSystem !== LayoutSystemTypes.ANVIL
  ) {
    return true;
  }

  // All other scenarios should work fine.
  return false;
}
