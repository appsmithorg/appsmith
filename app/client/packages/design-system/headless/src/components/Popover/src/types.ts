import type { MutableRefObject } from "react";
import type { CSSProperties } from "react";
import type { ReactNode } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { usePopover } from "./usePopover";
import type { Placement } from "@floating-ui/react";

export type ContextType =
  | (ReturnType<typeof usePopover> & {
      setLabelId: Dispatch<SetStateAction<string | undefined>>;
      setDescriptionId: Dispatch<SetStateAction<string | undefined>>;
    })
  | null;

export interface PopoverProps {
  /**
   * Whether the popover is open by default (uncontrolled).
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Defines placement of popover
   * @default bottom
   */
  placement?: Placement;
  /**
   * Determines if focus is “modal”, meaning focus is fully trapped inside the floating element and outside content cannot be accessed. This includes screen reader virtual cursors.
   * @default true
   */
  modal?: boolean;
  /**
   * Whether the overlay is open by default (controlled).
   * @default false
   */
  isOpen?: boolean;
  /** The method controls close and open state of popover. */
  setOpen?: (open: boolean) => void;
  /** The children of the component. */
  children?: ReactNode;
  /** Popover offset. */
  offset?: number;
  /** Handler that is called when the popover is closed. */
  onClose?: () => void;
  /** Open and close animation durations. */
  duration?: number;
  /** Ref of trigger element. This ref is necessary for adding aria attributes to trigger */
  triggerRef?: MutableRefObject<HTMLElement | null>;
  /** Which element to initially focus. Can be either a number (tabbable index as specified by the order) or a ref.  */
  initialFocus?: number | MutableRefObject<HTMLElement | null>;
  /** Determines whether clickOutside is work or not.
   * @default false
   */
  dismissClickOutside?: boolean;
}

export interface PopoverContentProps {
  /** The children of the component. */
  children: ReactNode;
  /**
   * Determines whether focusout event listeners that control whether the floating element should be closed if the focus moves outside of it are attached to the reference and floating elements. This mostly affects non-modal focus management.
   * @default false
   */
  closeOnFocusOut?: boolean;
  /** Sets inline [style](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style) for the element. Only use as a **last resort**. Use style props instead. */
  style?: CSSProperties;
  /** Sets the CSS className  for the content popover. Only use as a **last resort**. */
  contentClassName?: string;
}

export interface PopoverModalContentProps extends PopoverContentProps {
  /** Sets the CSS className  for the overlay. Only use as a **last resort**. */
  overlayClassName?: string;
}

export interface PopoverTriggerProps {
  /** The children of the component. */
  children: ReactNode;
}
