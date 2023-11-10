import type {
  PopoverContentProps,
  PopoverProps,
} from "@design-system/headless";
import type { ReactNode } from "react";

export interface ModalProps
  extends Pick<PopoverProps, "defaultOpen" | "isOpen" | "setOpen" | "onClose">,
    Pick<PopoverContentProps, "overlayClassName" | "contentClassName"> {
  /** Size of the Modal
   * @default medium
   */
  size?: "small" | "medium" | "large";
  /** The children of the component. */
  children: ReactNode;
}

export interface ModalHeaderProps {
  /** Adds a header modal Title and the necessary aria attributes. */
  title: string;
}

export interface ModalFooterProps {
  /** Submit button text
   * @default Submit
   */
  submitText?: string;
  /** Close button text
   * @default Close
   */
  closeText?: string;
  /** The event that is triggered when the submit button is clicked. */
  onSubmit?: () => void;
}

export interface ModalBodyProps {
  children: ReactNode;
}
