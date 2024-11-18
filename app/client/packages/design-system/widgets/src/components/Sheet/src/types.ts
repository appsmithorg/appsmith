import type { ModalOverlayProps as HeadlessModalOverlayProps } from "react-aria-components";

export interface SheetProps
  extends Omit<HeadlessModalOverlayProps, "position"> {
  /**
   * The position from which the sheet slides in
   * @default 'start'
   */
  position?: "start" | "end";
  onEntered?: () => void;
  onExited?: () => void;
}
