import type {
  PopoverModalContentProps,
  PopoverProps,
} from "@design-system/headless";
import type { ReactNode } from "react";

export interface ModalProps
  extends Pick<
      PopoverProps,
      "isOpen" | "setOpen" | "onClose" | "triggerRef" | "initialFocus"
    >,
    Pick<PopoverModalContentProps, "overlayClassName"> {
  /** Size of the Modal
   * @default medium
   */
  size?: "small" | "medium" | "large";
  /** The children of the component. */
  children: ReactNode;
}

export interface ModalContentProps {
  /** The children of the component. */
  children: ReactNode;
  /** Sets the CSS className  for the overlay. Only use as a **last resort**. */
  className?: string;
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
