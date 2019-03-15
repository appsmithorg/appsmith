export type WidgetType =
	| "TEXT_WIDGET"
	| "IMAGE_WIDGET"
	| "CONTAINER_WIDGET"
	| "LIST_WIDGET"
	| "INPUT_TEXT_WIDGET"
	| "CALLOUT_WIDGET"
	| "ICON_WIDGET"
	| "SPINNER_WIDGET";
export type ContainerOrientation = "HORIZONTAL" | "VERTICAL";
export type PositionType = "ABSOLUTE" | "CONTAINER_DIRECTION";
export type CSSUnit =
	| "px"
	| "cm"
	| "mm"
	| "in"
	| "pt"
	| "pc"
	| "em"
	| "ex"
	| "ch"
	| "rem"
	| "vw"
	| "vh"
	| "vmin"
	| "vmax"
	| "%";

export const CSSUnits: { [id: string]: CSSUnit } = {
	PIXEL: "px",
	RELATIVE_FONTSIZE: "em",
	RELATIVE_PARENT: "%"
};
