import type { WidgetLayoutProps, LayoutProps } from "../anvilTypes";

/**
 * @param layoutProps | LayoutProps : Layout
 * @returns boolean : whether layout renders widgets.
 */
export function doesLayoutRenderWidgets(layoutProps: LayoutProps) {
  // Return false whether layoutProps is undefined or layout is empty.
  if (!layoutProps || !layoutProps?.layout || !layoutProps?.layout?.length)
    return false;

  return isWidgetLayoutProps(layoutProps.layout[0]);
}

/**
 * @param props | WidgetLayoutProps | LayoutProps : List of widgetData or layouts
 * @returns whether props is a WidgetLayoutProps type.
 */
export function isWidgetLayoutProps(
  props: WidgetLayoutProps | LayoutProps,
): boolean {
  return "widgetId" in props;
}
