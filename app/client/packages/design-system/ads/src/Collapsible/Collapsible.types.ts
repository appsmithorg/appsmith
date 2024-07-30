export interface CollapsibleProps {
  /**
   * Both header and content of the collapsible will go here.
   */
  children: React.ReactNode;
  /** The open state of the collapsible. */
  isOpen?: boolean;
  /** Callback for when the collapsible is opened or closed. */
  onOpenChange?: (isOpen: boolean) => void;
  /* (try not to) pass addition classes here. */
  className?: string;
}

export interface CollapsibleContentProps {
  /** Content to be displayed when the component is expanded. */
  children: React.ReactNode;
  /* (try not to) pass addition classes here. */
  className?: string;
}

export const ARROW_POSITIONS = {
  START: "start",
  END: "end",
} as const;

export type ArrowPositions =
  (typeof ARROW_POSITIONS)[keyof typeof ARROW_POSITIONS];

export type CollapsibleHeaderProps = {
  /**
   * Any React Node that will go in the header.
   * Clicking on this will toggle the collapsible.
   */
  children: React.ReactNode;
  /* (try not to) pass addition classes here. */
  className?: string;
  /** Position of the arrow icons. Defaults to "start" */
  arrowPosition?: ArrowPositions;
} & React.HTMLAttributes<HTMLDivElement>;

export interface CollapsibleContextType {
  isExpanded: boolean;
  handleOpenChange: () => void;
}
