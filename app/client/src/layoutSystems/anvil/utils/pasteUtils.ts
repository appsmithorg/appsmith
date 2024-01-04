import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { all, call, put, select } from "redux-saga/effects";
import {
  getNextWidgetName,
  getSelectedWidgetWhenPasting,
} from "sagas/WidgetOperationUtils";
import { getWidgets } from "sagas/selectors";
import type { LayoutProps, WidgetLayoutProps } from "./anvilTypes";
import type BaseLayoutComponent from "../layoutComponents/BaseLayoutComponent";
import LayoutFactory from "../layoutComponents/LayoutFactory";
import { cloneDeep } from "lodash";
import { generateReactKey } from "utils/generators";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { getDataTree } from "selectors/dataTreeSelectors";
import { defaultHighlightRenderInfo } from "./constants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { updateAndSaveAnvilLayout } from "./anvilChecksUtils";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import history from "utils/history";
import { PASTE_FAILED, createMessage } from "@appsmith/constants/messages";
import { toast } from "design-system";
import { areWidgetsWhitelisted } from "./layouts/whitelistUtils";
import { anvilWidgets } from "widgets/anvil/constants";
import { handleWidgetMovement } from "../integrations/sagas/anvilDraggingSagas";

interface CopiedWidgetData {
  widgetId: string;
  parentId: string;
  list: FlattenedWidgetProps[];
}

export function* pasteSagas(copiedWidgets: CopiedWidgetData[]) {
  const originalWidgets: CopiedWidgetData[] = [...copiedWidgets];

  if (!originalWidgets.length) return;

  const selectedWidget: FlattenedWidgetProps =
    yield getSelectedWidgetWhenPasting();

  let allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  /**
   * Get new parentId to paste widgets into.
   */

  const newParentId: string | null = getNewParentId(
    allWidgets,
    selectedWidget,
    originalWidgets,
  );

  if (!newParentId) throw new Error("Invalid pasting parent");

  /**
   * Split copied widgets based on whether their parent has changed.
   */
  const {
    migrants,
    residents,
  }: { migrants: CopiedWidgetData[]; residents: CopiedWidgetData[] } =
    splitWidgets(originalWidgets, newParentId);

  console.log("####", {
    originalWidgets,
    selectedWidget,
    newParentId,
    migrants,
    residents,
  });
  /**
   * Track mapping between original and new widgetIds.
   */
  let widgetIdMap: { [key: string]: string } = {};
  let reverseWidgetIdMap: { [key: string]: string } = {};

  /**
   * For each resident, add them next to the original copied widget.
   */
  if (residents.length) {
    /**
     * For each resident,
     * 1. Create new widget.
     * 2. Update widget name.
     * 3. Find location of original widget in the parent layout.
     * 4. Add new widget after the original widget.
     */
    yield all(
      residents.map((resident: CopiedWidgetData) =>
        call(function* () {
          const { widgetId } = resident;
          /**
           * Create new widgets and add to new parent and all widgets.
           */
          const res: {
            map: { [key: string]: string };
            reverseMap: { [key: string]: string };
            widgets: CanvasWidgetsReduxState;
          } = yield call(
            addPastedWidgets,
            resident,
            allWidgets,
            widgetIdMap,
            reverseWidgetIdMap,
            newParentId,
          );
          allWidgets = res.widgets;
          widgetIdMap = res.map;
          reverseWidgetIdMap = res.reverseMap;

          // Update layout of new parent.
          allWidgets = {
            ...allWidgets,
            [newParentId]: {
              ...allWidgets[newParentId],
              layout: [
                addWidgetInPosition(
                  widgetId,
                  widgetIdMap[widgetId],
                  allWidgets[newParentId].layout[0],
                ),
              ],
            },
          };
          console.log("####", { widgetIdMap, reverseWidgetIdMap, allWidgets });
        }),
      ),
    );
  }

  /**
   * For each migrant, add them at the end of the new parent.
   * Order of migration should be maintained.
   */
  if (migrants.length) {
    /**
     * For each migrant,
     * 1. Create new widget.
     * 2. Update properties.
     * 3. Get original containing layouts.
     * 4. If newParent.childTemplate?.layoutType matches originalLayout.layoutType,
     *  4.1. true => Check if required layout already exists.
     *   a) true => add to the layout.
     *   b) false => add a new layout at the end of the parent.
     *  4.2. false => create new child template layout and add widget to it.
     *  4.3. newParent.childTemplate === null,
     *    => add all widgets to the end of the new parent.
     */

    const parentWidget = allWidgets[newParentId];

    yield all(
      migrants.map((migrant: CopiedWidgetData) =>
        call(function* () {
          /**
           * 1. Create new widgets.
           * 2. Add to newWidgets to new parent and update all widgets.
           */
          const res: {
            map: { [key: string]: string };
            reverseMap: { [key: string]: string };
            widgets: CanvasWidgetsReduxState;
          } = yield call(
            addPastedWidgets,
            migrant,
            allWidgets,
            widgetIdMap,
            reverseWidgetIdMap,
            newParentId,
          );
          allWidgets = res.widgets;
          widgetIdMap = res.map;
          reverseWidgetIdMap = res.reverseMap;
        }),
      ),
    );

    /**
     * Pasted widgets are added to new parent.
     * Now, add them to the layout of the new parent.
     */

    const isMainCanvas = parentWidget.widgetId === MAIN_CONTAINER_WIDGET_ID;
    const isSection = parentWidget.type === anvilWidgets.SECTION_WIDGET;

    /**
     * Get childTemplate of new parent.
     */
    const parentLayout: LayoutProps | null = getParentLayout(parentWidget);
    if (!parentLayout) return;
    const parentLayoutLength: number = parentLayout.layout.length;
    const Comp: typeof BaseLayoutComponent = LayoutFactory.get(
      parentLayout.layoutType,
    );

    const childTemplate: LayoutProps | null =
      Comp.getChildTemplate(parentLayout);

    if (!childTemplate) {
      /**
       * New parent doesn't use child templates.
       * => Insert all widgets at the end of the parent.
       */
      const movedWidgetIds: string[] = migrants.map(
        (each: CopiedWidgetData) => widgetIdMap[each.widgetId],
      );
      allWidgets = yield call(
        handleWidgetMovement,
        allWidgets,
        movedWidgetIds,
        {
          ...defaultHighlightRenderInfo,
          alignment: FlexLayerAlignment.Start,
          canvasId: newParentId,
          layoutOrder: [parentLayout.layoutId],
          rowIndex: parentLayoutLength,
        },
        isMainCanvas,
        isSection,
      );
    } else {
      /**
       * New parent uses a template.
       * => Use the template and the grouping status of copied widgets
       * to insert new entires in the new parent.
       */

      /**
       * Group copied widgets based on grouping status in original layouts.
       */
      const widgetGrouping: WidgetLayoutProps[][] = getContainingLayoutMapping(
        allWidgets,
        migrants,
      );

      let index = 0;
      let layoutId = "";
      for (const group of widgetGrouping) {
        let groupIndex = 0;
        for (const each of group) {
          const { alignment, widgetId } = each;
          if (groupIndex > 1 && !layoutId) {
            layoutId =
              allWidgets[newParentId].layout[0].layout[
                parentLayoutLength + index
              ].layoutId;
          }
          allWidgets = yield call(
            handleWidgetMovement,
            allWidgets,
            [widgetIdMap[widgetId]],
            {
              ...defaultHighlightRenderInfo,
              alignment,
              canvasId: newParentId,
              layoutOrder: layoutId
                ? [parentLayout.layoutId, layoutId]
                : [parentLayout.layoutId],
              // If groupIndex = 0 => insert a new entry at the end of the parent layout.
              // Else => add to the last entry in the parent layout.
              rowIndex: groupIndex ? groupIndex : parentLayoutLength + index,
            },
            isMainCanvas,
            isSection,
          );
          groupIndex += 1;
        }
        index += 1;
        layoutId = "";
      }
    }
  }

  /**
   * Save state
   */
  console.log("####", { parent: allWidgets[newParentId] });
  yield call(updateAndSaveAnvilLayout, allWidgets);

  const pageId: string = yield select(getCurrentPageId);

  if (originalWidgets?.length) {
    history.push(builderURL({ pageId }));
  }

  yield put({
    type: ReduxActionTypes.RECORD_RECENTLY_ADDED_WIDGET,
    payload: Object.values(widgetIdMap),
  });

  yield put(
    selectWidgetInitAction(
      SelectionRequestType.Multiple,
      Object.values(widgetIdMap),
    ),
  );
}

export function getNewParentId(
  allWidgets: CanvasWidgetsReduxState,
  selectedWidget: FlattenedWidgetProps,
  copiedWidgets: CopiedWidgetData[],
): string | null {
  /**
   * Return selectedWidget if it is the MainCanvas.
   */
  if (selectedWidget.widgetId === MAIN_CONTAINER_WIDGET_ID)
    return selectedWidget.widgetId;

  /**
   * Return selectedWidget if it has a layout property.
   * => it is a container widget (Section / Zone / Modal).
   */
  if (!!selectedWidget.layout) {
    if (!prePasteValidations(selectedWidget, copiedWidgets)) return null;
    return selectedWidget.widgetId;
  } else {
    /**
     * Selected widget is a non-layout widget.
     *
     * If the widget doesn't have a valid parent, return null.
     */
    if (!selectedWidget.parentId || !allWidgets[selectedWidget.parentId])
      return null;
    /**
     * Recursively check if the parent is a valid layout widget.
     */
    const parentId: string | null = getNewParentId(
      allWidgets,
      allWidgets[selectedWidget.parentId],
      copiedWidgets,
    );
    return parentId;
  }
}

/**
 * Split copied widgets based on migration status.
 * migrants => parentId has changed.
 * residents => parentId has not changed.
 * @param copiedWidgets | CopiedWidgetData[] : list of copied widgets.
 * @param newParentId | string : new parent id to paste widgets into.
 */
function splitWidgets(
  copiedWidgets: CopiedWidgetData[],
  newParentId: string,
): { migrants: CopiedWidgetData[]; residents: CopiedWidgetData[] } {
  const migrants: CopiedWidgetData[] = [];
  const residents: CopiedWidgetData[] = [];

  copiedWidgets.forEach((copiedWidget: CopiedWidgetData) => {
    if (copiedWidget.parentId === newParentId) residents.push(copiedWidget);
    else migrants.push(copiedWidget);
  });

  return { migrants, residents };
}

function getContainingLayoutMapping(
  allWidgets: CanvasWidgetsReduxState,
  copiedWidgets: CopiedWidgetData[],
): WidgetLayoutProps[][] {
  let widgetGrouping: WidgetLayoutProps[][] = [];
  const parentMap: { [key: string]: string[] } = {};

  /**
   * Group widgets by similar parents.
   */
  copiedWidgets.forEach((copiedWidget: CopiedWidgetData) => {
    if (parentMap[copiedWidget.parentId]) {
      parentMap[copiedWidget.parentId].push(copiedWidget.widgetId);
    } else {
      parentMap[copiedWidget.parentId] = [copiedWidget.widgetId];
    }
  });

  Object.keys(parentMap).forEach((key: string) => {
    const parent: FlattenedWidgetProps = allWidgets[key];
    if (!parent || !parent.layout) return;

    const containingLayouts: WidgetLayoutProps[][] = extractContainingLayouts(
      parent.layout[0],
      parentMap[key],
    );
    widgetGrouping = [...widgetGrouping, ...containingLayouts];
  });
  return widgetGrouping;
}

function extractContainingLayouts(
  layout: LayoutProps,
  widgetIds: string[],
  res: WidgetLayoutProps[][] = [],
): WidgetLayoutProps[][] {
  if (!widgetIds?.length) return res;
  const arr: WidgetLayoutProps[] = [];
  const indices: number[] = [];
  const widgets: string[] = [...widgetIds];
  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(layout.layoutType);

  if (Comp.rendersWidgets) {
    const childWidgets: string[] = (layout.layout as WidgetLayoutProps[]).map(
      (each: WidgetLayoutProps) => each.widgetId,
    );
    widgets.forEach((each: string, index: number) => {
      const childIndex: number = childWidgets.indexOf(each);
      if (childIndex !== -1) {
        arr.push(layout.layout[childIndex] as WidgetLayoutProps);
      }
      if (arr.length) {
        res.push(arr);
        indices.push(index);
      }
    });
  } else {
    (layout.layout as LayoutProps[]).forEach((each: LayoutProps) => {
      extractContainingLayouts(
        each,
        widgets.filter(
          (each: string, index: number) => !indices.includes(index),
        ),
        res,
      );
    });
  }
  return res;
}

function updateLayoutProps(
  layout: LayoutProps,
  widgetIdMap: { [key: string]: string },
): LayoutProps {
  // Replace layoutId with a new value
  layout.layoutId = generateReactKey();

  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(layout.layoutType);

  if (Comp.rendersWidgets) {
    // If the layout renders widgets, replace widgetIds with new values
    const widgetLayouts = layout.layout as WidgetLayoutProps[];
    layout.layout = widgetLayouts.map((item: WidgetLayoutProps) => {
      item.widgetId = widgetIdMap[item.widgetId] || item.widgetId;
      return item;
    });
  } else {
    // If the layout renders layouts, parse them recursively
    const layoutProps = layout.layout as LayoutProps[];
    layout.layout = layoutProps.map((item: LayoutProps) => {
      return updateLayoutProps(item, widgetIdMap);
    });
  }

  return layout;
}

function addWidgetInPosition(
  oldWidgetId: string,
  newWidgetId: string,
  layout: LayoutProps,
): LayoutProps {
  let updatedLayout: LayoutProps = { ...layout };
  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(
    updatedLayout.layoutType,
  );

  if (Comp.rendersWidgets) {
    const widgetLayouts = updatedLayout.layout as WidgetLayoutProps[];
    /**
     * Find location of original widget.
     */
    const index = widgetLayouts.findIndex(
      (item: WidgetLayoutProps) => item.widgetId === oldWidgetId,
    );
    if (index === -1) return updatedLayout;
    const insertItem: WidgetLayoutProps = {
      ...widgetLayouts[index],
      widgetId: newWidgetId,
    };
    /**
     * Add new widget after the original widget (index + 1)
     */
    return Comp.addChild(updatedLayout, [insertItem], {
      ...defaultHighlightRenderInfo,
      canvasId: "",
      layoutOrder: [updatedLayout.layoutId],
      rowIndex: index + 1,
      alignment: insertItem.alignment,
    });
  } else {
    const layoutProps = updatedLayout.layout as LayoutProps[];
    updatedLayout.layout = layoutProps.map((item: LayoutProps) => {
      return addWidgetInPosition(oldWidgetId, newWidgetId, item);
    });
  }

  return updatedLayout;
}

function* addPastedWidgets(
  arr: CopiedWidgetData,
  allWidgets: CanvasWidgetsReduxState,
  widgetIdMap: { [key: string]: string },
  reverseWidgetIdMap: { [key: string]: string },
  newParentId: string,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };
  const map: { [key: string]: string } = { ...widgetIdMap };
  const reverseMap: { [key: string]: string } = { ...reverseWidgetIdMap };
  const { list, widgetId } = arr;
  const newList: FlattenedWidgetProps[] = [];

  const evalTree: DataTree = yield select(getDataTree);

  AnalyticsUtil.logEvent("WIDGET_PASTE", {
    widgetName: widgets[widgetId].widgetName,
    widgetType: widgets[widgetId].type,
  });

  /**
   * Create new widgets.
   */

  list.forEach((each: FlattenedWidgetProps) => {
    // Clone old widget to create new one.
    const newWidget = cloneDeep(each);
    newWidget.widgetId = generateReactKey();

    // Map old and new widgets
    map[each.widgetId] = newWidget.widgetId;
    reverseMap[newWidget.widgetId] = each.widgetId;

    // Add new widget to the list.
    newList.push(newWidget);
  });

  /**
   * Update properties of new widgets.
   */
  newList.forEach((widget: FlattenedWidgetProps) => {
    widget.parentId = newParentId;
    widget.widgetName = getNextWidgetName(widgets, widget.type, evalTree, {
      prefix: widget.widgetName,
      startWithoutIndex: true,
    });

    if (widget.children?.length) {
      widget.children = widget.children.map((child: string) => {
        return map[child];
      });
    }

    if (widget.layout) {
      widget.layout = [updateLayoutProps(cloneDeep(widget.layout[0]), map)];
    }

    /**
     * Add widget to all widgets.
     */
    widgets = {
      ...widgets,
      [widget.widgetId]: widget,
    };
  });

  console.log("####", { newList });

  /**
   * Add widgets after original widget and update new parent.
   */
  const parentWidget: FlattenedWidgetProps = widgets[newParentId];
  widgets = {
    ...widgets,
    [newParentId]: {
      ...parentWidget,
      children: [...(parentWidget?.children || []), map[widgetId]],
    },
  };

  console.log("####", { newParentId, parent: widgets[newParentId] });

  return { widgets, map, reverseMap };
}

function showErrorToast(message: string): void {
  toast.show(createMessage(PASTE_FAILED, message), {
    kind: "error",
  });
}

function getParentLayout(parent: FlattenedWidgetProps): LayoutProps | null {
  if (!parent || !parent.layout) return null;
  // TODO: @Preet - remove this hard coding.
  return parent.layout[0];
}

function prePasteValidations(
  parentWidget: FlattenedWidgetProps,
  copiedWidgets: CopiedWidgetData[],
): boolean {
  /**
   * Check copied widgets for presence of same layout widgets or presence of the parent widget itself.
   */
  let matchingParent = false,
    matchingType = false;
  const widgetTypes: string[] = copiedWidgets.map((data: CopiedWidgetData) => {
    const type = data.list[0].type;
    if (type === parentWidget.type) matchingType = true;
    if (data.widgetId === parentWidget.widgetId) matchingParent = true;
    return type;
  });
  if (matchingParent) {
    showErrorToast(
      `Cannot paste ${parentWidget.type} widgets into themselves.`,
    );
    return false;
  }
  if (matchingType) {
    showErrorToast(`Cannot nest ${parentWidget.type} widgets.`);
    return false;
  }
  /**
   * Check if all copied widgets are whitelisted by the new parent layout.
   */
  const parentLayout = getParentLayout(parentWidget);
  if (
    parentLayout?.allowedWidgetTypes &&
    !areWidgetsWhitelisted(widgetTypes, parentLayout?.allowedWidgetTypes)
  ) {
    showErrorToast("Some widgets are not allowed in this layout");
    return false;
  }

  return true;
}
