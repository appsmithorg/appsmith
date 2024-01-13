import type { ReactNode, CSSProperties } from "react";
import type { SizingDimension, SpacingDimension } from "./dimensions";

export type Responsive<T> =
  | T
  | {
      base?: T;
      [custom: string]: T | undefined;
    };

export interface AlignContent {
  /**
   * The distribution of space around child items along the cross axis. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/align-content).
   * @default 'start'
   */
  alignContent?: Responsive<
    | "start"
    | "end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "stretch"
    | "baseline"
    | "first baseline"
    | "last baseline"
    | "safe center"
    | "unsafe center"
  >;
}

export interface AlignItems {
  /**
   * The alignment of children within their container. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/align-items).
   * @default 'stretch'
   */
  alignItems?: Responsive<
    | "start"
    | "end"
    | "center"
    | "stretch"
    | "self-start"
    | "self-end"
    | "baseline"
    | "first baseline"
    | "last baseline"
    | "safe center"
    | "unsafe center"
  >;
}

export interface AlignSelf {
  /** Overrides the `alignItems` property of a flex or grid container. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/align-self). */
  alignSelf?: Responsive<
    | "auto"
    | "normal"
    | "start"
    | "end"
    | "center"
    | "flex-start"
    | "flex-end"
    | "self-start"
    | "self-end"
    | "stretch"
  >;
}

export interface JustifyContent {
  /**
   * The distribution of space around items along the main axis. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content).
   * @default 'stretch'
   */
  justifyContent?: Responsive<
    | "start"
    | "end"
    | "center"
    | "left"
    | "right"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | "stretch"
    | "baseline"
    | "first baseline"
    | "last baseline"
    | "safe center"
    | "unsafe center"
  >;
}

export interface JustifySelf {
  /** Specifies how the element is justified inside a flex or grid container. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-self). */
  justifySelf?: Responsive<
    | "auto"
    | "normal"
    | "start"
    | "end"
    | "flex-start"
    | "flex-end"
    | "self-start"
    | "self-end"
    | "center"
    | "left"
    | "right"
    | "stretch"
  >;
}

export interface FlexDirection {
  /**
   * The direction in which to layout children. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction).
   * @default 'row'
   */
  direction?: Responsive<"row" | "column" | "row-reverse" | "column-reverse">;
}

export interface FlexWrap {
  /**
   * Whether to wrap items onto multiple lines. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap).
   * @default false
   */
  wrap?: Responsive<boolean | "wrap" | "nowrap" | "wrap-reverse">;
}

export interface FlexProps
  extends AlignContent,
    AlignItems,
    AlignSelf,
    JustifyContent,
    JustifySelf,
    FlexDirection,
    FlexWrap {
  /*
   * Layout props
   */

  /** The space to display between both rows and columns. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/gap). */
  gap?: Responsive<SpacingDimension>;
  /** The space to display between columns. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/column-gap). */
  columnGap?: Responsive<SpacingDimension>;
  /** The space to display between rows. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/row-gap). */
  rowGap?: Responsive<SpacingDimension>;
  /** When used in a flex layout, specifies how the element will grow or shrink to fit the space available. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/flex). */
  flex?: Responsive<string | number | boolean>;
  /** When used in a flex layout, specifies how the element will grow to fit the space available. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-grow). */
  flexGrow?: Responsive<number>;
  /** When used in a flex layout, specifies how the element will shrink to fit the space available. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-shrink). */
  flexShrink?: Responsive<number>;
  /** When used in a flex layout, specifies the initial main size of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-basis). */
  flexBasis?: Responsive<SizingDimension>;

  /** The layout order for the element within a flex or grid container. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/order). */
  order?: Responsive<number>;
  /** Hides the element. */
  isHidden?: Responsive<boolean>;
  /** Rendered contents of the item or child items. */

  /*
   * Spacing props
   */
  /** The margin for all four sides of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/margin). */
  margin?: Responsive<SpacingDimension>;
  /** The margin for the left side of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/margin-left). */
  marginLeft?: Responsive<SpacingDimension>;
  /** The margin for the right side of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/margin-right).*/
  marginRight?: Responsive<SpacingDimension>;
  /** The margin for the top side of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/margin-top). */
  marginTop?: Responsive<SpacingDimension>;
  /** The margin for the bottom side of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/margin-bottom). */
  marginBottom?: Responsive<SpacingDimension>;

  /** The padding for all four sides of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/padding). */
  padding?: Responsive<SpacingDimension>;
  /** The padding for the left side of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/padding-left). */
  paddingLeft?: Responsive<SpacingDimension>;
  /** The padding for the right side of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/padding-right). */
  paddingRight?: Responsive<SpacingDimension>;
  /** The padding for the top side of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/padding-top). */
  paddingTop?: Responsive<SpacingDimension>;
  /** The padding for the bottom side of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/padding-bottom). */
  paddingBottom?: Responsive<SpacingDimension>;

  /*
   * Sizing props
   */
  /** The width of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/width). */
  width?: Responsive<SizingDimension>;
  /** The height of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/height). */
  height?: Responsive<SizingDimension>;
  /** The minimum width of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/min-width). */
  minWidth?: Responsive<SizingDimension>;
  /** The minimum height of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/min-height). */
  minHeight?: Responsive<SizingDimension>;
  /** The maximum width of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/max-width). */
  maxWidth?: Responsive<SizingDimension>;
  /** The maximum height of the element. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/max-height). */
  maxHeight?: Responsive<SizingDimension>;

  /*
   * Advanced props
   */
  /** Enables container queries mode. It is important, without this flag, responsiveness will not work. See [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/container-type). */
  isContainer?: boolean;
  /** The children of the component. */
  children?: ReactNode;
  /** Sets the CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. Only use as a **last resort**. Use style props instead. */
  className?: string;
  /** Sets inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. Only use as a **last resort**. Use style props instead. */
  style?: CSSProperties;
  /** Sets the HTML [id](https://developer.mozilla.org/en-US/docs/Web/API/Element/id) for the element. */
  id?: string;
}

export type FlexCssProps = Omit<
  FlexProps,
  "isContainer" | "children" | "className" | "style" | "id"
>;

export type CssVarValues = FlexCssProps[
  | "gap"
  | "flexBasis"
  | "margin"
  | "marginLeft"
  | "marginRight"
  | "marginTop"
  | "padding"
  | "paddingLeft"
  | "paddingRight"
  | "paddingTop"
  | "marginBottom"
  | "width"
  | "height"
  | "minWidth"
  | "minHeight"
  | "maxWidth"
  | "maxHeight"];
