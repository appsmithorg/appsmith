import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { CopiedWidgetData, PasteDestinationInfo } from "./types";
import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import { getWidgetHierarchy } from "./utils";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import type { LayoutProps, WidgetLayoutProps } from "../anvilTypes";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

export function* getDestinedParent(
  allWidgets: CanvasWidgetsReduxState,
  copiedWidgets: CopiedWidgetData[],
  selectedWidget: FlattenedWidgetProps,
  overrideParentWidgetId?: string,
) {
  const childHierarchy: number = copiedWidgets[0].hierarchy;
  const parentHierarchy: number = getWidgetHierarchy(
    selectedWidget.type,
    selectedWidget.widgetId,
  );

  const parentOrder: string[] = [selectedWidget.widgetId];
  let index = parentHierarchy;
  let currentWidget: FlattenedWidgetProps = selectedWidget;
  while (index >= childHierarchy) {
    if (!currentWidget.parentId) {
      /**
       * If a parent in the tree doesn't have a parentId,
       * Then add all to MainCanvas.
       */
      parentOrder.push(MAIN_CONTAINER_WIDGET_ID);
      break;
    }
    /**
     * Traverse up the parent - child tree,
     * tracking all parentIds, until we reach a hierarchy where the copied widgets can be added.
     * MainCanvas > Section > Zone > Widgets.
     */
    const parent: FlattenedWidgetProps = allWidgets[currentWidget?.parentId];
    index = getWidgetHierarchy(parent.type, parent.widgetId);
    currentWidget = parent;
    parentOrder.push(parent.widgetId);
  }

  if (overrideParentWidgetId) parentOrder.push(overrideParentWidgetId);

  /**
   * Deduce the position index of pasted widgets in the new parent.
   */
  const pasteInfo: PasteDestinationInfo = getPastingInfo(
    allWidgets[parentOrder[parentOrder.length - 1]],
    allWidgets[parentOrder[parentOrder.length - 2]]?.widgetId,
    parentOrder,
  );
  return pasteInfo;
}

function getPastingInfo(
  parent: FlattenedWidgetProps,
  child: string,
  parentOrder: string[],
): PasteDestinationInfo {
  if (!parent.layout) {
    return {
      alignment: FlexLayerAlignment.Start,
      layoutOrder: [],
      parentOrder,
      rowIndex: [0],
    };
  }
  const layout: LayoutProps = parent.layout[0];
  const info: Omit<PasteDestinationInfo, "parentOrder"> =
    parentOrder.length === 1
      ? getLastIndexInLayout(parent)
      : getChildIndexInLayout(layout, child, [layout], [layout.layout.length]);
  return { ...info, parentOrder };
}

function getLastIndexInLayout(
  widget: FlattenedWidgetProps,
): Omit<PasteDestinationInfo, "parentOrder"> {
  if (!widget.layout || !widget.layout.length) {
    return {
      alignment: FlexLayerAlignment.Start,
      layoutOrder: [],
      rowIndex: [0],
    };
  }
  const layout: LayoutProps = widget.layout[0];
  const rowIndex = [layout.layout.length];
  return {
    alignment: FlexLayerAlignment.Start,
    layoutOrder: [layout],
    rowIndex,
  };
}

function getChildIndexInLayout(
  layout: LayoutProps,
  childId: string,
  layoutOrder: LayoutProps[],
  rowIndex: number[],
): Omit<PasteDestinationInfo, "parentOrder"> {
  const Comp: typeof BaseLayoutComponent = LayoutFactory.get(layout.layoutType);

  if (Comp.rendersWidgets) {
    const index = (layout.layout as WidgetLayoutProps[]).findIndex(
      (w: WidgetLayoutProps) => w.widgetId === childId,
    );
    if (index === -1)
      return {
        alignment: FlexLayerAlignment.Start,
        layoutOrder,
        rowIndex: [...rowIndex, -1],
      };
    return {
      alignment: (layout.layout[index] as WidgetLayoutProps).alignment,
      layoutOrder,
      rowIndex: [...rowIndex, index + 1],
    };
  } else {
    let res: Omit<PasteDestinationInfo, "parentOrder"> = {
      alignment: FlexLayerAlignment.Start,
      layoutOrder,
      rowIndex: [...rowIndex, -1],
    };
    (layout.layout as LayoutProps[]).forEach(
      (each: LayoutProps, index: number) => {
        const temp: Omit<PasteDestinationInfo, "parentOrder"> =
          getChildIndexInLayout(
            each,
            childId,
            [...layoutOrder, each],
            [...rowIndex, index + 1],
          );
        if (temp.rowIndex[temp.rowIndex.length - 1] !== -1) res = temp;
      },
    );
    return res;
  }
}
