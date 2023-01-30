import WidgetFactory from "utils/WidgetFactory";
import { WidgetSizeConfig } from "widgets/constants";

export interface MinSize {
  minHeight: number | string;
  minWidth: number | string;
}

export function getRightColumn(widget: any, isMobile: boolean): number {
  return isMobile && widget.mobileRightColumn !== undefined
    ? widget.mobileRightColumn
    : widget.rightColumn;
}

export function setRightColumn(
  widget: any,
  val: number | null,
  isMobile: boolean,
): any {
  if (val === null) return widget;
  return isMobile && widget.mobileRightColumn !== undefined
    ? { ...widget, mobileRightColumn: val }
    : { ...widget, rightColumn: val };
}

export function getLeftColumn(widget: any, isMobile: boolean): number {
  return isMobile && widget.mobileLeftColumn !== undefined
    ? widget.mobileLeftColumn
    : widget.leftColumn;
}

export function setLeftColumn(
  widget: any,
  val: number | null,
  isMobile: boolean,
): any {
  if (val === null) return widget;
  return isMobile && widget.mobileLeftColumn !== undefined
    ? { ...widget, mobileLeftColumn: val }
    : { ...widget, leftColumn: val };
}

export function getTopRow(widget: any, isMobile: boolean): number {
  return isMobile && widget.mobileTopRow !== undefined
    ? widget.mobileTopRow
    : widget.topRow;
}

export function setTopRow(
  widget: any,
  val: number | null,
  isMobile: boolean,
): any {
  if (val === null) return widget;
  return isMobile && widget.mobileTopRow !== undefined
    ? { ...widget, mobileTopRow: val }
    : { ...widget, topRow: val };
}

export function getBottomRow(widget: any, isMobile: boolean): number {
  return isMobile && widget.mobileBottomRow !== undefined
    ? widget.mobileBottomRow
    : widget.bottomRow;
}

export function setBottomRow(
  widget: any,
  val: number | null,
  isMobile: boolean,
): any {
  if (val === null) return widget;
  return isMobile && widget.mobileBottomRow !== undefined
    ? { ...widget, mobileBottomRow: val }
    : { ...widget, bottomRow: val };
}

export function setColumns(
  widget: any,
  left: number,
  right: number,
  isMobile: boolean,
) {
  return setRightColumn(setLeftColumn(widget, left, isMobile), right, isMobile);
}

export function setDimensions(
  widget: any,
  top: number | null,
  bottom: number | null,
  left: number | null,
  right: number | null,
  isMobile: boolean,
) {
  try {
    return setBottomRow(
      setTopRow(
        setLeftColumn(setRightColumn(widget, right, isMobile), left, isMobile),
        top,
        isMobile,
      ),
      bottom,
      isMobile,
    );
  } catch (e) {
    // console.log(e);
    return widget;
  }
}

export function getWidgetWidth(widget: any, isMobile: boolean): number {
  return getRightColumn(widget, isMobile) - getLeftColumn(widget, isMobile);
}

export function getWidgetHeight(widget: any, isMobile: boolean): number {
  return getBottomRow(widget, isMobile) - getTopRow(widget, isMobile);
}

export function getWidgetRows(widget: any, isMobile: boolean): number {
  const divisor = widget.parentRowSpace === 1 ? 10 : 1;
  return getBottomRow(widget, isMobile) / divisor - getTopRow(widget, isMobile);
}

/**
 * Calculates the minimum size of a widget based on the widget type and the canvas width.
 * @param widget | Widget props
 * @param canvasWidth | number : main canvas width.
 * @returns MinSize | undefined
 */
export function getMinSize(
  widget: any,
  canvasWidth: number,
): MinSize | undefined {
  // Get the widget size configuration.
  const sizeConfig = WidgetFactory.getWidgetAutoLayoutConfig(widget.type);
  if (!sizeConfig || !sizeConfig?.widgetSize?.length) return;

  // Find the most suitable breakpoint for the canvas width.
  const sizes: WidgetSizeConfig[] = sizeConfig?.widgetSize;
  let index = 0;
  while (index < sizes?.length && canvasWidth > sizes[index].viewportMinWidth) {
    index += 1;
  }

  // Get the minimum size for the widget at this breakpoint.
  const { minHeight, minWidth } = sizes[index - 1].configuration(widget);

  return { minHeight, minWidth };
}

/**
 * Return the minimum pixel width of a widget based on the widget type and the canvas width.
 * minSize can be configured in columns (number) or pixels (string).
 * Return an appropriate pixel width based on the minSize type.
 */
export function getMinPixelWidth(
  widget: any,
  canvasWidth: number,
): number | undefined {
  if (!widget) return;
  const minSize = getMinSize(widget, canvasWidth);
  if (!minSize) return;
  const arr: string[] =
    typeof minSize.minWidth === "string" ? minSize.minWidth.split("px") : [];
  if (arr.length) return parseInt(arr[0]);
  if (typeof minSize.minWidth === "number")
    return minSize.minWidth * widget.parentColumnSpace;
}
