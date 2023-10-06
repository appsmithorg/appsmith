import type {
  AnvilHighlightInfo,
  LayoutProps,
  WidgetLayoutProps,
} from "../anvilTypes";
import Row from "layoutSystems/anvil/layoutComponents/components/Row";
import AlignedColumn from "layoutSystems/anvil/layoutComponents/components/AlignedColumn";
import AlignedRow from "layoutSystems/anvil/layoutComponents/components/AlignedRow";
import Column from "layoutSystems/anvil/layoutComponents/components/Column";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import { isWidgetLayoutProps } from "./typeUtils";

const layoutComponents = [AlignedColumn, AlignedRow, Column, Row];

export function registerLayoutComponents() {
  LayoutFactory.initialize(layoutComponents);
}

export function generateLayoutId(canvasId: string, layoutId: string): string {
  return `layout-${canvasId}-${layoutId}`;
}

/**
 * Update a layout component by adding supplied list of widgets / layouts to it.
 * @param props | LayoutComponentProps - Parent Layout.
 * @param children | string[] | LayoutComponentProps[] - List of child widgets or layouts to be added to the parent layout.
 * @param highlight | HighlightInfo - Drop Information.
 * @returns LayoutComponentProps
 */
export function addChildToLayout(
  props: LayoutProps,
  children: WidgetLayoutProps[] | LayoutProps[],
  highlight: AnvilHighlightInfo,
): LayoutProps {
  const layout: WidgetLayoutProps[] | LayoutProps[] = props.layout;
  const { rowIndex: index } = highlight;
  return {
    ...props,
    layout: [...layout.slice(0, index), ...children, ...layout.slice(index)] as
      | LayoutProps[]
      | WidgetLayoutProps[],
  };
}

/**
 * Update a layout by removing children at a specified index.
 * return undefined if layout is not permanent and is empty after deletion.
 * @param props | LayoutComponentProps - Parent Layout.
 * @param child | string | LayoutComponentProps - Child (widget / layout) to be removed.
 * @returns LayoutComponentProps | undefined
 */
export function removeChildFromLayout(
  props: LayoutProps,
  child: WidgetLayoutProps | LayoutProps,
): LayoutProps | undefined {
  if (!child) return props;
  let updatedLayout: LayoutProps = { ...props };
  if (isWidgetLayoutProps(child)) {
    updatedLayout = {
      ...props,
      layout: (props.layout as WidgetLayoutProps[]).filter(
        (each: WidgetLayoutProps) =>
          each.widgetId !== (child as WidgetLayoutProps).widgetId,
      ),
    };
  } else {
    updatedLayout = {
      ...props,
      layout: (props.layout as LayoutProps[]).filter(
        (each: LayoutProps) =>
          each.layoutId !== (child as LayoutProps).layoutId,
      ),
    };
  }
  return updatedLayout.isPermanent || updatedLayout.layout?.length
    ? updatedLayout
    : undefined;
}

export function extractWidgetIdsFromLayoutProps(props: LayoutProps): string[] {
  if (!props || !props.layout.length) return [];
  return (props.layout as WidgetLayoutProps[]).map(
    (each: WidgetLayoutProps) => each.widgetId,
  );
}
