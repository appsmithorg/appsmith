import { getIsAutoLayout } from "selectors/editorSelectors";
import store from "store";
import WidgetFactory from "utils/WidgetFactory";
import type { WidgetSizeConfig } from "widgets/constants";

export interface MinMaxSize {
  minHeight: number | string;
  maxHeight: number | string;
  minWidth: number | string;
  maxWidth: number | string;
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
  return isMobile
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
  return isMobile
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
  return isMobile
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
  return isMobile
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
 * Calculates the minimum & maximum size of a widget based on the widget type and the canvas width.
 * @param widget | Widget props
 * @param canvasWidth | number : main canvas width.
 * @returns MinSize | undefined
 */
function getMinMaxSize(
  widget: any,
  canvasWidth: number,
): MinMaxSize | undefined {
  // Get the widget size configuration.
  const sizeConfig = getCurrentSizeConfig(widget, canvasWidth);
  if (!sizeConfig) return;

  // Get the minimum & maximum size for the widget at this breakpoint.
  const { maxHeight, maxWidth, minHeight, minWidth } =
    sizeConfig.configuration(widget);

  return { maxHeight, maxWidth, minHeight, minWidth };
}

export function getCurrentSizeConfig(
  widget: any,
  canvasWidth: number,
): WidgetSizeConfig | undefined {
  // Get the widget size configuration.
  const sizeConfig = WidgetFactory.getWidgetAutoLayoutConfig(widget.type);
  if (!sizeConfig || !sizeConfig?.widgetSize?.length) return;

  // Find the most suitable breakpoint for the canvas width.
  const sizes: WidgetSizeConfig[] = sizeConfig?.widgetSize;
  let index = 0;
  while (index < sizes?.length && canvasWidth > sizes[index].viewportMinWidth) {
    index += 1;
  }
  return sizes[index - 1];
}

function getPxValue(val: string | number, factor: number): number | undefined {
  const arr: string[] = typeof val === "string" ? val.split("px") : [];
  if (arr.length) return parseInt(arr[0]);
  if (typeof val === "number") return val * factor;
}

/**
 * Return the widget dimension constraints based on the widget type and the canvas width.
 * size can be configured in columns (number) or pixels (string).
 * Return an appropriate pixel width & height based on the size type.
 */
export function getWidgetMinMaxDimensionsInPixel(
  widget: any,
  canvasWidth: number,
): { [key in keyof MinMaxSize]: number | undefined } {
  const returnValue: { [key in keyof MinMaxSize]: number | undefined } = {
    minWidth: undefined,
    minHeight: undefined,
    maxWidth: undefined,
    maxHeight: undefined,
  };

  if (!widget) return returnValue;
  const minMaxSize = getMinMaxSize(widget, canvasWidth);
  if (!minMaxSize) return returnValue;

  returnValue.minWidth = getPxValue(
    minMaxSize.minWidth,
    widget.parentColumnSpace,
  );

  returnValue.maxWidth = getPxValue(
    minMaxSize.maxWidth,
    widget.parentColumnSpace,
  );

  returnValue.minHeight = getPxValue(
    minMaxSize.minHeight,
    widget.parentRowSpace,
  );

  returnValue.maxHeight = getPxValue(
    minMaxSize.maxHeight,
    widget.parentRowSpace,
  );

  return returnValue;
}

export function isAutoLayout() {
  const appState = store.getState();
  return !!getIsAutoLayout(appState);
}
