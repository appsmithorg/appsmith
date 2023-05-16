import React, { forwardRef } from "react";
import { mergeProps } from "@react-aria/utils";
import { useButton } from "@react-aria/button";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import type { AriaButtonProps as SpectrumAriaBaseButtonProps } from "@react-types/button";

export interface ButtonProps
  extends Omit<
    SpectrumAriaBaseButtonProps,
    "onFocus" | "onBlur" | "onFocusChange"
  > {
  className?: string;
}

export type ButtonRef = React.Ref<HTMLButtonElement>;

export const Button = forwardRef((props: ButtonProps, ref: ButtonRef) => {
  const { autoFocus, children, className, isDisabled } = props;
  const { buttonProps, isPressed } = useButton(props, ref as any);
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
      ref={ref}
    >
      {children}
    </button>
  );
});
