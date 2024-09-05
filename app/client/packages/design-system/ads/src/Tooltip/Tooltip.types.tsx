import type { TooltipProps as RcTooltipProps } from "rc-tooltip/lib/Tooltip";

// TODO: these constants should be kebab-case + write a function to convert that into camelCase and pass into rc
export type TooltipPlacement =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "rightTop"
  | "rightBottom"
  | "leftTop"
  | "leftBottom";

// Tooltip props
export type TooltipProps = {
  /** (try not to) pass addition classes here */
  className?: string;
  /** Tooltip content to be shown */
  content: string | React.ReactNode;
  /** Tooltip placement */
  placement?: TooltipPlacement;
  /** Whether tooltip is disabled */
  isDisabled?: boolean;
} & Omit<
  RcTooltipProps,
  | "overlayStyle"
  | "prefixCls"
  | "overlayClassName"
  | "overlayInnerStyle"
  | "overlay"
>;
