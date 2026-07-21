import type { Alignment } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import type { ButtonVariant } from "components/constants";
import type { WidgetProps } from "widgets/BaseWidget";

export const MediaPositionTypes = {
  TOP: "TOP",
  LEFT: "LEFT",
  NONE: "NONE",
} as const;

export type MediaPosition = keyof typeof MediaPositionTypes;

export const MediaObjectFitTypes = {
  COVER: "cover",
  CONTAIN: "contain",
} as const;

export type MediaObjectFit =
  (typeof MediaObjectFitTypes)[keyof typeof MediaObjectFitTypes];

// Fixed chrome sizes (px) used both for rendering and for sizing the body canvas.
export const CARD_HEADER_HEIGHT = 50;
export const CARD_FOOTER_HEIGHT = 48;
export const DEFAULT_MEDIA_HEIGHT = 140;
export const MEDIA_LEFT_WIDTH = 120;

export interface CardMenuItem {
  id: string;
  index: number;
  widgetId: string;
  label?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  iconName?: IconName;
  iconAlign?: Alignment;
  iconColor?: string;
  textColor?: string;
  backgroundColor?: string;
  onClick?: string;
}

export interface CardFooterAction {
  id: string;
  index: number;
  widgetId: string;
  label?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  iconName?: IconName;
  iconAlign?: Alignment;
  buttonVariant?: ButtonVariant;
  buttonColor?: string;
  onClick?: string;
}

export interface CardWidgetProps extends WidgetProps {
  children?: WidgetProps[];
  cardData?: Record<string, unknown>;

  // Media zone
  mediaImage?: string;
  mediaAltText?: string;
  mediaPosition: MediaPosition;
  mediaHeight?: number;
  mediaObjectFit?: MediaObjectFit;

  // Header zone
  showHeader: boolean;
  avatarImage?: string;
  avatarIcon?: IconName;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  menuItems: Record<string, CardMenuItem>;

  // Footer zone
  showFooter: boolean;
  footerActions: Record<string, CardFooterAction>;

  // Interaction
  isClickable: boolean;
  onCardClick?: string;
  isDisabled?: boolean;

  // Selection (meta)
  selectionEnabled?: boolean;
  defaultSelected?: boolean;
  isSelected?: boolean;
  onSelect?: string;

  // Expansion (meta)
  expandCollapseEnabled?: boolean;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onExpand?: string;
  onCollapse?: string;

  // Style
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  boxShadow?: string;
  showHeaderDivider: boolean;
  showFooterDivider: boolean;
  hoverElevation: boolean;
  selectedAccentColor?: string;
  shouldScrollContents?: boolean;
}
