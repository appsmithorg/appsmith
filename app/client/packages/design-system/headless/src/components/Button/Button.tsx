import React, { forwardRef } from "react";
import { mergeProps } from "@react-aria/utils";
import { useButton } from "@react-aria/button";
import { useFocusRing } from "@react-aria/focus";
import { useHover } from "@react-aria/interactions";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import type { AriaButtonProps as SpectrumAriaBaseButtonProps } from "@react-types/button";

export interface ButtonProps extends SpectrumAriaBaseButtonProps {
  className?: string;
  isLoading?: boolean;
  visuallyDisabled?: boolean;
  loadingIcon?: React.ReactNode;
}

export type ButtonRef = React.Ref<HTMLButtonElement>;
type ButtonRefObject = React.RefObject<HTMLButtonElement>;

export const Button = forwardRef((props: ButtonProps, ref: ButtonRef) => {
  const {
    autoFocus,
    children,
    className,
    isDisabled,
    isLoading,
    loadingIcon,
    visuallyDisabled,
  } = props;
  props = useVisuallyDisabled(props);
  const { visuallyHiddenProps } = useVisuallyHidden();
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const { focusProps, isFocusVisible } = useFocusRing({ autoFocus });
  const { buttonProps, isPressed } = useButton(props, ref as ButtonRefObject);

  const renderChildren = () => {
    if (isLoading) {
      return (
        <>
          {loadingIcon}
          <span {...visuallyHiddenProps}>Loading...</span>
        </>
      );
    }

    return children;
  };

  return (
    <button
      {...mergeProps(buttonProps, hoverProps, focusProps)}
      aria-disabled={visuallyDisabled || isLoading ? true : undefined}
      className={className}
      data-active={isPressed ? "" : undefined}
      data-disabled={isDisabled ? "" : undefined}
      data-focused={isFocusVisible ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      data-loading={isLoading ? "" : undefined}
      disabled={visuallyDisabled ? undefined : isDisabled}
      ref={ref}
    >
      {renderChildren()}
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

  if (props.visuallyDisabled || props.isLoading) {
    computedProps = {
      ...props,
      isDisabled: false,
      // disabling click/press events
      onPress: undefined,
      onPressStart: undefined,
      onPressEnd: undefined,
      onPressChange: undefined,
    };
  }

  return computedProps;
};
