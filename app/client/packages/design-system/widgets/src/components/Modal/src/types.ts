import type {
  PopoverModalContentProps,
  PopoverProps,
} from "@appsmith/wds-headless";
import type { ReactNode } from "react";
import type { SIZES } from "@appsmith/wds";

export interface ModalProps
  extends Pick<
      PopoverProps,
      | "isOpen"
      | "setOpen"
      | "onClose"
      | "triggerRef"
      | "initialFocus"
      | "dismissClickOutside"
    >,
    Pick<PopoverModalContentProps, "overlayClassName"> {
  /** size of the modal
   * @default medium
   */
  size?: Exclude<keyof typeof SIZES, "xSmall">;
  /** The children of the component. */
  children: ReactNode;
  /** Additional props to be passed to the overlay */
  overlayProps?: Record<string, string>;
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
  excludeFromTabOrder?: boolean;
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
  excludeFromTabOrder?: boolean;
  /** Defines if the modal should close when submit button is pressed */
  closeOnSubmit?: boolean;
}

export interface ModalBodyProps {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
