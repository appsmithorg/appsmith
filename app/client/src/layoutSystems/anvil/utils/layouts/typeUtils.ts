import type { LayoutComponentProps } from "../anvilTypes";

export function doesListIncludeWidgetIDs(
  layoutProps: LayoutComponentProps,
): boolean {
  // Return false whether layoutProps is undefined or layout is empty.
  if (!layoutProps || !layoutProps?.layout || !layoutProps?.layout?.length)
    return false;

  const { layout } = layoutProps;
  /**
   * Check for typeof first item of the layout.
   * ASSUMPTION: Layouts will either render widgets or layouts. Not both.
   */
  return typeof layout[0] === "string";
}

export function doesAlignedRowRenderWidgets(
  layoutProps: LayoutComponentProps,
): boolean {
  // Return false whether layoutProps is undefined or layout is empty.
  if (!layoutProps || !layoutProps?.layout || !layoutProps?.layout?.length)
    return false;

  const layout: string[][] = layoutProps?.layout as string[][];
  /**
   * Check for typeof first item of the layout.
   * ASSUMPTION: Layouts will either render widgets or layouts. Not both.
   */
  return layout.reduce((acc: boolean, each: string[]) => {
    return (
      acc ||
      (Array.isArray(each) && each?.length > 0 && typeof each[0] === "string")
    );
  }, false);
}

export function doesLayoutRenderWidgets(layoutProps: LayoutComponentProps) {
  // Return false whether layoutProps is undefined or layout is empty.
  if (!layoutProps || !layoutProps?.layout || !layoutProps?.layout?.length)
    return false;

  const { layoutType } = layoutProps;

  if (layoutType === "ALIGNED_ROW") {
    // AlignedRow's layout prop is a 2D array.
    return doesAlignedRowRenderWidgets(layoutProps);
  } else return doesListIncludeWidgetIDs(layoutProps);
}
