import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { CopiedWidgetData } from "./types";
import { all, call } from "redux-saga/effects";
import { addPastedWidgets } from "./utils";
import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../anvilTypes";
import type BaseLayoutComponent from "layoutSystems/anvil/layoutComponents/BaseLayoutComponent";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { defaultHighlightRenderInfo } from "../constants";
import { generateReactKey } from "utils/generators";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import { addWidgetsToPreset } from "../layouts/update/additionUtils";
import type { WidgetLayoutPositionInfo } from "../layouts/widgetPositionUtils";

export function* pasteResidentWidgets(
  allWidgets: CanvasWidgetsReduxState,
  widgetIdMap: Record<string, string>,
  reverseWidgetIdMap: Record<string, string>,
  copiedWidgets: CopiedWidgetData[],
  parentId: string,
) {
  let widgets: CanvasWidgetsReduxState = { ...allWidgets };
  let map: Record<string, string> = { ...widgetIdMap };
  let reverseMap: Record<string, string> = { ...reverseWidgetIdMap };
  /**
   * For each resident,
   * 1. Create new widget.
   * 2. Update widget name.
   * 3. Find location of original widget in the parent layout.
   * 4. Add new widget after the original widget.
   */
  yield all(
    copiedWidgets.map((resident: CopiedWidgetData) =>
      call(function* () {
        const { widgetId } = resident;
        /**
         * Create new widgets and add to new parent and all widgets.
         */
        const res: {
          map: Record<string, string>;
          reverseMap: Record<string, string>;
          widgets: CanvasWidgetsReduxState;
        } = yield call(
          addPastedWidgets,
          resident,
          widgets,
          map,
          reverseMap,
          parentId,
        );
        widgets = res.widgets;
        map = res.map;
        reverseMap = res.reverseMap;

        // Update layout of new parent.
        widgets = {
          ...widgets,
          [parentId]: {
            ...widgets[parentId],
            layout: updateLayout(
              widgets,
              widgetId,
              map[widgetId],
              widgets[parentId].layout[0],
              resident,
            ),
          },
        };
      }),
    ),
  );

  return { map, reverseMap, widgets };
}

function updateLayout(
  widgets: CanvasWidgetsReduxState,
  oldWidgetId: string,
  newWidgetId: string,
  layout: LayoutProps,
  copiedWidget: CopiedWidgetData,
): LayoutProps[] {
  const { widgetPositionInfo } = copiedWidget;

  if (widgets[oldWidgetId]) {
    // old Widget is not deleted
    return [addWidgetInPosition(oldWidgetId, newWidgetId, layout)];
  }

  const widgetLayoutProps = getWidgetLayoutProps(
    widgetPositionInfo,
    newWidgetId,
    widgets,
  );
  const highlightInfo = getHighlightInfo(
    widgetPositionInfo,
    copiedWidget,
    layout,
    widgets,
    oldWidgetId,
  );

  return addWidgetsToPreset([layout], highlightInfo, widgetLayoutProps);
}

function getWidgetLayoutProps(
  widgetPositionInfo: WidgetLayoutPositionInfo | null,
  newWidgetId: string,
  widgets: CanvasWidgetsReduxState,
): WidgetLayoutProps[] {
  if (widgetPositionInfo) {
    return [{ ...widgetPositionInfo.widgetLayoutProps, widgetId: newWidgetId }];
  } else {
    return [
      {
        widgetId: newWidgetId,
        widgetType: widgets[newWidgetId].type,
        alignment: FlexLayerAlignment.Start,
      },
    ];
  }
}

function getHighlightInfo(
  widgetPositionInfo: WidgetLayoutPositionInfo | null,
  copiedWidget: CopiedWidgetData,
  parentLayout: LayoutProps,
  widgets: CanvasWidgetsReduxState,
  oldWidgetId: string,
): AnvilHighlightInfo {
  const { parentId } = copiedWidget;
  const { layout, layoutId } = parentLayout;
  const oldWidgetExists = widgetPositionInfo && widgets[oldWidgetId];

  const layoutOrder = oldWidgetExists
    ? widgetPositionInfo!.layoutOrder
    : [layoutId];
  const rowIndex =
    widgetPositionInfo && oldWidgetExists
      ? widgetPositionInfo!.rowIndex + 1
      : layout.length;

  return {
    ...defaultHighlightRenderInfo,
    canvasId: parentId,
    layoutId,
    layoutOrder,
    rowIndex,
    alignment: FlexLayerAlignment.Start,
  };
}

function addWidgetInPosition(
  oldWidgetId: string,
  newWidgetId: string,
  layout: LayoutProps,
): LayoutProps {
  const updatedLayout: LayoutProps = { ...layout };
  const LayoutComponent: typeof BaseLayoutComponent = LayoutFactory.get(
    updatedLayout.layoutType,
  );

  if (LayoutComponent.rendersWidgets) {
    return addWidgetInWidgetLayout(
      oldWidgetId,
      newWidgetId,
      updatedLayout,
      LayoutComponent,
    );
  } else {
    return addWidgetInLayoutProps(oldWidgetId, newWidgetId, updatedLayout);
  }
}

function addWidgetInWidgetLayout(
  oldWidgetId: string,
  newWidgetId: string,
  updatedLayout: LayoutProps,
  LayoutComponent: typeof BaseLayoutComponent,
): LayoutProps {
  const widgetLayouts = updatedLayout.layout as WidgetLayoutProps[];
  const index = getWidgetIndex(updatedLayout, oldWidgetId);
  if (index === -1) return updatedLayout;
  const insertItem: WidgetLayoutProps = {
    ...widgetLayouts[index],
    widgetId: newWidgetId,
  };
  return LayoutComponent.addChild(updatedLayout, [insertItem], {
    ...defaultHighlightRenderInfo,
    canvasId: "",
    layoutId: updatedLayout.layoutId,
    layoutOrder: [updatedLayout.layoutId],
    rowIndex: index + 1,
    alignment: insertItem.alignment,
  });
}

function addWidgetInLayoutProps(
  oldWidgetId: string,
  newWidgetId: string,
  updatedLayout: LayoutProps,
): LayoutProps {
  const layoutProps = updatedLayout.layout as LayoutProps[];
  updatedLayout.layout = layoutProps.reduce(
    (acc: LayoutProps[], item: LayoutProps) => {
      const LayoutComp: typeof BaseLayoutComponent = LayoutFactory.get(
        item.layoutType,
      );
      if (LayoutComp.rendersWidgets) {
        const index: number = getWidgetIndex(item, oldWidgetId);
        const { layout, maxChildLimit } = item;
        if (index === -1) acc.push(item);
        else if (
          maxChildLimit !== undefined &&
          layout.length === maxChildLimit
        ) {
          acc.push(item);
          const insertItem: WidgetLayoutProps = {
            ...(item.layout[index] as WidgetLayoutProps),
            widgetId: newWidgetId,
          };
          acc.push({
            ...item,
            layout: [insertItem],
            layoutId: generateReactKey(),
          });
        } else acc.push(addWidgetInPosition(oldWidgetId, newWidgetId, item));
      } else acc.push(addWidgetInPosition(oldWidgetId, newWidgetId, item));
      return acc;
    },
    [],
  );
  return updatedLayout;
}

function getWidgetIndex(props: LayoutProps, widgetId: string): number {
  const widgetLayouts: WidgetLayoutProps[] =
    props.layout as WidgetLayoutProps[];
  return widgetLayouts.findIndex(
    (item: WidgetLayoutProps) => item.widgetId === widgetId,
  );
}
