import type { HighlightInfo } from "layoutSystems/common/utils/types";
import type { LayoutComponentProps } from "../anvilTypes";
import { AlignmentIndexMap } from "../constants";

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
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  highlight: HighlightInfo,
): LayoutComponentProps {
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
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  highlight: HighlightInfo,
): LayoutComponentProps {
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
  return { ...props, layout: updatedLayout } as LayoutComponentProps;
}

/**
 * Update a layout by removing children at a specified index.
 * @param props | LayoutComponentProps - Parent Layout.
 * @param highlight | HighlightInfo - Drop Information.
 * @returns LayoutComponentProps
 */
export function removeChildFromLayout(
  props: LayoutComponentProps,
  highlight: HighlightInfo,
): LayoutComponentProps {
  const layout: any = props.layout;
  const { rowIndex: index } = highlight;
  return {
    ...props,
    layout: [...layout.slice(0, index), ...layout.slice(index + 1)],
  };
}
