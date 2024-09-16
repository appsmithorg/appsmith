import type { HoverCardContentProps as RadixHoverCardContentProps } from "@radix-ui/react-hover-card";

// AnnouncementPopover props
export type AnnouncementPopoverContentProps = {
  /** the banner url of the announcement */
  banner: string;
  /** the title of the announcement */
  title: string;
  /** the description of the announcement */
  description: string;
  /** the footer of the announcement */
  footer?: React.ReactNode;
  /** color for arrow fill */
  arrowFillColor?: string;
  /** action to trigger on close button clicked */
  onCloseButtonClick?: () => void;
} & RadixHoverCardContentProps;
