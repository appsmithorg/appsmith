import React, { forwardRef } from "react";
import { mergeProps } from "@react-aria/utils";
import { useButton } from "@react-aria/button";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import type { AriaButtonProps as SpectrumAriaBaseButtonProps } from "@react-types/button";

export interface ButtonProps extends SpectrumAriaBaseButtonProps {
  className?: string;
  /**
   * If true, the button will be disabled visually and functionally.
   * Note: Visually disabled button can be focused.
   */
  visuallyDisabled?: boolean;
  /**
   * Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user.
   */
  "aria-busy"?: boolean;
}

export type ButtonRef = React.Ref<HTMLButtonElement>;
type ButtonRefObject = React.RefObject<HTMLButtonElement>;

export const Button = forwardRef((props: ButtonProps, ref: ButtonRef) => {
  const { autoFocus, children, className, isDisabled, visuallyDisabled } =
    props;
  props = useVisuallyDisabled(props);
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });
  const { buttonProps, isPressed } = useButton(props, ref as ButtonRefObject);

  return (
    <button
      {...mergeProps(buttonProps, hoverProps, focusProps)}
      aria-busy={props["aria-busy"] ? true : undefined}
      aria-disabled={visuallyDisabled ? true : undefined}
      className={className}
      data-active={isPressed ? "" : undefined}
      data-disabled={isDisabled ? "" : undefined}
      data-focused={isFocusVisible ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      disabled={visuallyDisabled ? undefined : isDisabled}
      ref={ref}
    >
      {children}
    </button>
  );
});

/**
 * This hook is used to disable all click/press events on a button
 * when the button is visually disabled
 *
 * @param props
 * @returns
 */
const useVisuallyDisabled = (props: ButtonProps) => {
  let computedProps = props;

  if (props.visuallyDisabled) {
    computedProps = {
      ...props,
      isDisabled: false,
      // disabling click/press events
      onPress: undefined,
      onPressStart: undefined,
      onPressEnd: undefined,
      onPressChange: undefined,
      onPressUp: undefined,
      onKeyDown: undefined,
      onKeyUp: undefined,
    };
  }

  return computedProps;
};
