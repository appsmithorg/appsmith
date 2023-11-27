import React, { forwardRef } from "react";
import { mergeProps } from "@react-aria/utils";
import { useButton } from "@react-aria/button";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import type { AriaButtonProps as SpectrumAriaBaseButtonProps } from "@react-types/button";

export interface ButtonProps extends SpectrumAriaBaseButtonProps {
  /** classname to be passed to the button  */
  className?: string;
  /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user.*/
  "aria-busy"?: boolean;
  /** Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable. */
  "aria-disabled"?: boolean;
  /** Indicates if the button can be dragged, this is mandatory for editor because of this bug - https://bugzilla.mozilla.org/show_bug.cgi?id=568313 */
  draggable?: boolean;
}

export type ButtonRef = React.Ref<HTMLButtonElement>;
type ButtonRefObject = React.RefObject<HTMLButtonElement>;

const _Button = (props: ButtonProps, ref: ButtonRef) => {
  const {
    autoFocus,
    children,
    className,
    draggable = false,
    isDisabled = false,
    ...rest
  } = props;
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });
  const { buttonProps, isPressed } = useButton(
    { isDisabled, ...rest },
    ref as ButtonRefObject,
  );

  return (
    <button
      {...mergeProps(buttonProps, hoverProps, focusProps)}
      aria-busy={props["aria-busy"] ?? undefined}
      aria-disabled={props["aria-disabled"] ?? undefined}
      className={className}
      data-active={isPressed ? "" : undefined}
      data-disabled={isDisabled ? "" : undefined}
      data-focused={isFocusVisible ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      draggable={draggable ? "true" : undefined}
      ref={ref}
    >
      {children}
    </button>
  );
};

export const Button = forwardRef(_Button);
