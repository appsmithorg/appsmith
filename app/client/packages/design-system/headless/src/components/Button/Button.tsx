import type { RefObject } from "react";
import React, { forwardRef } from "react";
import { mergeProps } from "@react-aria/utils";
import { useButton } from "@react-aria/button";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import { useFocusableRef } from "@react-spectrum/utils";
import type { FocusableRef } from "@react-types/shared";
import type {
  AriaButtonProps as SpectrumAriaBaseButtonProps,
  ButtonProps as SpectrumButtonProps,
} from "@react-types/button";

export interface ButtonProps
  extends SpectrumButtonProps,
    SpectrumAriaBaseButtonProps {
  className?: string;
}

export type ButtonRef = FocusableRef<HTMLElement>;

export const Button = forwardRef((props: ButtonProps, ref: ButtonRef) => {
  const { autoFocus, children, className, isDisabled } = props;
  const domRef = useFocusableRef(ref) as RefObject<HTMLButtonElement>;
  const { buttonProps, isPressed } = useButton(props, domRef);
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });

  return (
    <button
      {...mergeProps(buttonProps, hoverProps, focusProps)}
      className={className}
      data-active={isPressed ? "" : undefined}
      data-disabled={isDisabled ? "" : undefined}
      data-focused={isFocusVisible ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      ref={domRef}
    >
      {children}
    </button>
  );
});
