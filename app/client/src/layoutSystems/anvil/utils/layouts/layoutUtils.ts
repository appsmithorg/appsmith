import type {
  AnvilHighlightInfo,
  LayoutComponentProps,
  LayoutProps,
} from "../anvilTypes";
import { AlignmentIndexMap } from "../constants";
import Row from "layoutSystems/anvil/layoutComponents/components/Row";
import AlignedColumn from "layoutSystems/anvil/layoutComponents/components/AlignedColumn";
import AlignedRow from "layoutSystems/anvil/layoutComponents/components/AlignedRow";
import Column from "layoutSystems/anvil/layoutComponents/components/Column";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";

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
  children: string[] | LayoutProps[],
  highlight: AnvilHighlightInfo,
): LayoutProps {
  const layout: any = props.layout;
  const { rowIndex: index } = highlight;
  return {
    ...props,
    layout: [...layout.slice(0, index), ...children, ...layout.slice(index)],
  };
}

/**
 * Update an AlignedRow component by adding supplied list of widgets / layouts to the proper alignment.
 * @param props | LayoutComponentProps - Parent Layout.
 * @param children | string[] | LayoutComponentProps[] - List of child widgets or layouts to be added to the parent layout.
 * @param highlight | HighlightInfo - Drop Information.
 * @returns LayoutComponentProps
 */
export function addChildToAlignedRow(
  props: LayoutProps,
  children: string[] | LayoutProps[],
  highlight: AnvilHighlightInfo,
): LayoutProps {
  const layout: string[][] = props.layout as string[][];
  const { alignment, rowIndex: index } = highlight;
  // Extract index of the affected alignment.
  const alignmentIndex: number = AlignmentIndexMap[alignment];
  // Extract the list data of the affected alignment.
  const alignmentRow: string[] = layout[alignmentIndex];
  // Add children in the appropriate position.
  const updatedAlignmentRow: string[] = [
    ...alignmentRow.slice(0, index),
    ...children,
    ...alignmentRow.slice(index),
  ] as string[];
  const updatedLayout = [...layout];
  // Update the affected alignment in the parent layout.
  updatedLayout[alignmentIndex] = updatedAlignmentRow as string[];
  return { ...props, layout: updatedLayout } as LayoutProps;
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
  child: string | LayoutProps,
): LayoutProps | undefined {
  let updatedLayout: LayoutProps = { ...props };
  if (typeof child === "string") {
    updatedLayout = {
      ...props,
      layout: (props.layout as string[]).filter(
        (each: string) => each !== child,
      ),
    };
  } else {
    updatedLayout = {
      ...props,
      layout: (props.layout as LayoutComponentProps[]).filter(
        (each: LayoutComponentProps) => each.layoutId !== child.layoutId,
      ),
    };
  }
  return updatedLayout.isPermanent || updatedLayout.layout?.length
    ? updatedLayout
    : undefined;
}

/**
 * Update AlignedRow by removing children at a specified index from a specified alignment.
 * return undefined if layout is not permanent and is empty after deletion.
 * @param props | LayoutComponentProps - Parent Layout.
 * @param highlight | HighlightInfo - Drop Information.
 * @returns LayoutComponentProps | undefined
 */
export function removeChildFromAlignedRow(
  props: LayoutProps,
  child: string,
): LayoutProps | undefined {
  const layout: string[][] = props.layout as string[][];
  // Extract index of the affected alignment.
  const alignmentIndex: number = layout.findIndex(
    (each: string[]) => each.indexOf(child) !== -1,
  );
  if (alignmentIndex === -1) return props;
  // Extract the list data of the affected alignment.
  const alignmentRow: string[] = layout[alignmentIndex];
  // Remove child at the appropriate position.
  const updatedAlignmentRow: string[] = alignmentRow.filter(
    (each: string) => each !== child,
  );
  const updatedLayout = [...layout];
  // Update the affected alignment in the parent layout.
  updatedLayout[alignmentIndex] = updatedAlignmentRow as string[];
  return props.isPermanent ||
    updatedLayout.reduce(
      (acc: number, each: string[]) => acc + each.length,
      0,
    ) > 0
    ? ({ ...props, layout: updatedLayout } as LayoutComponentProps)
    : undefined;
}
