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
