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
import { addWidgetsToChildTemplate } from "./layouts/update/additionUtils";
import { updateAndSaveAnvilLayout } from "./anvilChecksUtils";
import { builderURL } from "@appsmith/RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { selectWidgetInitAction } from "actions/widgetSelectionActions";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import history from "utils/history";

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

  const newParentId: string | null = getNewParentId(allWidgets, selectedWidget);

  if (!newParentId) throw new Error("Invalid pasting parent");

  /**
   * Split copied widgets based on whether their parent has changed.
   */
  const {
    migrants,
    residents,
  }: { migrants: CopiedWidgetData[]; residents: CopiedWidgetData[] } =
    splitWidgets(originalWidgets, newParentId);

  /**
   * Track mapping between original and new widgetIds.
   */
  const widgetIdMap: { [key: string]: string } = {};
  const reverseWidgetIdMap: { [key: string]: string } = {};

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
          yield call(
            addPastedWidgets,
            resident,
            allWidgets,
            widgetIdMap,
            reverseWidgetIdMap,
            newParentId,
          );

          // Update layout of new parent.
          allWidgets = {
            ...allWidgets,
            [newParentId]: {
              ...allWidgets[newParentId],
              layout: addWidgetInPosition(
                widgetId,
                widgetIdMap[widgetId],
                allWidgets[newParentId].layout[0],
              ),
            },
          };
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

    /**
     * Get a mapping of original widgets to their parent layout.
     */
    const widgetLayoutMap: { [key: string]: LayoutProps } =
      getContainingLayoutMapping(allWidgets, migrants);

    // const layoutWidgetGrouping: { [key: string]: string[] } = Object.keys(
    //   widgetLayoutMap,
    // ).reduce((acc: { [key: string]: string[] }, curr: string) => {
    //   const layoutId: string = widgetLayoutMap[curr].layoutId;
    //   if (acc[layoutId]) {
    //     acc[layoutId].push(curr);
    //   } else {
    //     acc[layoutId] = [curr];
    //   }
    //   return acc;
    // }, {});

    const insertedLayouts: { [key: string]: string } = {};

    const parentWidget = allWidgets[newParentId];
    let parentLayout: LayoutProps = parentWidget.layout[0];

    yield all(
      migrants.map((migrant: CopiedWidgetData) =>
        call(function* () {
          const { widgetId } = migrant;
          /**
           * 1. Create new widgets.
           * 2. Add to newWidgets to new parent and update all widgets.
           */
          yield call(
            addPastedWidgets,
            migrant,
            allWidgets,
            widgetIdMap,
            reverseWidgetIdMap,
            newParentId,
          );

          /**
           * Get childTemplate of new parent.
           */
          const Comp: typeof BaseLayoutComponent = LayoutFactory.get(
            parentLayout.layoutType,
          );

          const insertItem: WidgetLayoutProps = {
            widgetId: widgetIdMap[widgetId],
            widgetType: allWidgets[widgetIdMap[widgetId]].type,
            alignment:
              Comp.rendersWidgets && parentLayout.layout.length
                ? (
                    parentLayout.layout[
                      parentLayout.layout.length - 1
                    ] as WidgetLayoutProps
                  ).alignment
                : FlexLayerAlignment.Start,
          };

          const childTemplate: LayoutProps | null = Comp.getChildTemplate(
            parentLayout,
            [insertItem],
          );

          if (!childTemplate || !widgetLayoutMap[widgetId]) {
            /**
             * New parent doesn't use child templates.
             * => Insert widget at the end of the parent.
             */
            parentLayout = Comp.addChild(parentLayout, [insertItem], {
              ...defaultHighlightRenderInfo,
              canvasId: newParentId,
              layoutOrder: [parentLayout.layoutId],
              rowIndex: parentLayout.layout.length,
              alignment: insertItem.alignment,
            });
          } else if (
            childTemplate.layoutType === widgetLayoutMap[widgetId].layoutType
          ) {
            /**
             * New parent uses childTemplate and layoutType matches.
             */
            const oldLayoutId: string = widgetLayoutMap[widgetId].layoutId;

            // Check if a matching new layout has already been created.
            if (insertedLayouts[oldLayoutId]) {
              parentLayout = {
                ...parentLayout,
                layout: (parentLayout.layout as LayoutProps[]).map(
                  (each: LayoutProps) => {
                    if (each.layoutId === insertedLayouts[oldLayoutId]) {
                      const layoutComp: typeof BaseLayoutComponent =
                        LayoutFactory.get(each.layoutType);
                      return layoutComp.addChild(each, [insertItem], {
                        ...defaultHighlightRenderInfo,
                        canvasId: newParentId,
                        layoutOrder: [each.layoutId],
                        rowIndex: each.layout.length,
                        alignment: insertItem.alignment,
                      });
                    }
                    return each;
                  },
                ),
              };
            } else {
              /**
               * Create new layout using ChildTemplate.
               * and add to parent.
               */
              parentLayout = addWidgetsToChildTemplate(
                parentLayout,
                Comp,
                [insertItem],
                {
                  ...defaultHighlightRenderInfo,
                  canvasId: newParentId,
                  layoutOrder: [parentLayout.layoutId],
                  rowIndex: parentLayout.layout.length,
                  alignment: insertItem.alignment,
                },
              );
              insertedLayouts[oldLayoutId] = (
                parentLayout.layout[
                  parentLayout.layout.length - 1
                ] as LayoutProps
              ).layoutId;
            }
          } else {
            /**
             * Create new layout using ChildTemplate.
             * and add to parent.
             */
            parentLayout = addWidgetsToChildTemplate(
              parentLayout,
              Comp,
              [insertItem],
              {
                ...defaultHighlightRenderInfo,
                canvasId: newParentId,
                layoutOrder: [parentLayout.layoutId],
                rowIndex: parentLayout.layout.length,
                alignment: insertItem.alignment,
              },
            );
          }
        }),
      ),
    );

    allWidgets = {
      ...allWidgets,
      [newParentId]: {
        ...allWidgets[newParentId],
        layout: parentLayout,
      },
    };
  }

  /**
   * Save state
   */
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
  if (!!selectedWidget.layout) return selectedWidget.widgetId;
  else {
    /**
     * Selected widget is a non-layout widget.
     */
    /**
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
): { [key: string]: LayoutProps } {
  let widgetLayoutMap: { [key: string]: LayoutProps } = {};
  const parentMap: { [key: string]: string[] } = {};

  /**
   * Extract all affected parents.
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

    const containingLayouts: { [key: string]: LayoutProps } =
      extractContainingLayouts(parent.layout[0], parentMap[key]);
    widgetLayoutMap = {
      ...widgetLayoutMap,
      ...containingLayouts,
    };
  });
  return widgetLayoutMap;
}

function extractContainingLayouts(
  layout: LayoutProps,
  widgetIds: string[],
  res: { [key: string]: LayoutProps } = {},
): { [key: string]: LayoutProps } {
  if (!widgetIds?.length) return res;
  const widgets: string[] = [...widgetIds];
  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(layout.layoutType);

  if (Comp.rendersWidgets) {
    const childWidgets: string[] = (layout.layout as WidgetLayoutProps[]).map(
      (each: WidgetLayoutProps) => each.widgetId,
    );
    widgets.forEach((each: string) => {
      if (childWidgets.indexOf(each) !== -1) {
        res[each] = layout;
      }
    });
  } else {
    (layout.layout as LayoutProps[]).forEach((each: LayoutProps) => {
      extractContainingLayouts(each, widgetIds, res);
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
  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(layout.layoutType);

  if (Comp.rendersWidgets) {
    const widgetLayouts = layout.layout as WidgetLayoutProps[];
    /**
     * Find location of original widget.
     */
    const index = widgetLayouts.findIndex(
      (item: WidgetLayoutProps) => item.widgetId === oldWidgetId,
    );
    if (index === undefined) return layout;
    const insertItem: WidgetLayoutProps = {
      ...widgetLayouts[index],
      widgetId: newWidgetId,
    };
    /**
     * Add new widget after the original widget (index + 1)
     */
    return Comp.addChild(layout, [insertItem], {
      ...defaultHighlightRenderInfo,
      canvasId: "",
      layoutOrder: [layout.layoutId],
      rowIndex: index + 1,
      alignment: insertItem.alignment,
    });
  } else {
    const layoutProps = layout.layout as LayoutProps[];
    layout.layout = layoutProps.map((item: LayoutProps) => {
      return addWidgetInPosition(oldWidgetId, newWidgetId, item);
    });
  }

  return layout;
}

function* addPastedWidgets(
  arr: CopiedWidgetData,
  allWidgets: CanvasWidgetsReduxState,
  widgetIdMap: { [key: string]: string },
  reverseWidgetIdMap: { [key: string]: string },
  newParentId: string,
) {
  const { list, widgetId } = arr;
  const newList: FlattenedWidgetProps[] = [];

  const evalTree: DataTree = yield select(getDataTree);

  AnalyticsUtil.logEvent("WIDGET_PASTE", {
    widgetName: allWidgets[widgetId].widgetName,
    widgetType: allWidgets[widgetId].type,
  });

  /**
   * Create new widgets.
   */

  list.forEach((each: FlattenedWidgetProps) => {
    // Clone old widget to create new one.
    const newWidget = cloneDeep(each);
    newWidget.widgetId = generateReactKey();

    // Map old and new widgets
    widgetIdMap[each.widgetId] = newWidget.widgetId;
    reverseWidgetIdMap[newWidget.widgetId] = each.widgetId;

    // Add new widget to the list.
    newList.push(newWidget);
  });

  /**
   * Update properties of new widgets.
   */
  newList.forEach((widget: FlattenedWidgetProps) => {
    widget.parentId = newParentId;
    widget.widgetName = getNextWidgetName(allWidgets, widget.type, evalTree, {
      prefix: widget.widgetName,
      startWithoutIndex: true,
    });

    if (widget.children?.length) {
      widget.children = widget.children.map((child: string) => {
        return widgetIdMap[child];
      });
    }

    if (widget.layout) {
      widget.layout = [
        updateLayoutProps(cloneDeep(widget.layout[0]), widgetIdMap),
      ];
    }

    /**
     * Add widget to all widgets.
     */
    allWidgets = {
      ...allWidgets,
      [widget.widgetId]: widget,
    };
  });

  /**
   * Add widgets after original widget and update new parent.
   */
  const parentWidget: FlattenedWidgetProps = allWidgets[newParentId];
  allWidgets = {
    ...allWidgets,
    [newParentId]: {
      ...parentWidget,
      children: [...(parentWidget?.children || []), widgetIdMap[widgetId]],
    },
  };
}
