import React, { forwardRef } from "react";
import { useVisuallyHidden } from "@react-aria/visually-hidden";

import { Text } from "../Text";
import type {
  ButtonProps as HeadlessButtonProps,
  ButtonRef as HeadlessButtonRef,
} from "@design-system/headless";
import { Spinner } from "../Spinner";
import { StyledButton } from "./index.styled";
import { Icon as HeadlessIcon } from "@design-system/headless";

export type ButtonVariants = "primary" | "secondary" | "tertiary";

export interface ButtonProps extends Omit<HeadlessButtonProps, "className"> {
  /**
   *  @default primary
   */
  variant?: ButtonVariants;
  isFitContainer?: boolean;
  isFocused?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  visuallyDisabled?: boolean;
}

export const Button = forwardRef(
  (props: ButtonProps, ref: HeadlessButtonRef) => {
    props = useVisuallyDisabled(props);
    const {
      children,
      icon,
      iconPosition = "start",
      isFitContainer = false,
      isLoading,
      // eslint-disable-next-line -- TODO add onKeyUp when the bug is fixed https://github.com/adobe/react-spectrum/issues/4350
      onKeyUp,
      variant = "primary",
      visuallyDisabled,
      ...rest
    } = props;
    const { visuallyHiddenProps } = useVisuallyHidden();

    const renderChildren = () => {
      if (isLoading) {
        return (
          <>
            <HeadlessIcon>
              <Spinner />
            </HeadlessIcon>
            <span {...visuallyHiddenProps}>Loading...</span>
          </>
        );
      }

      return (
        <>
          {icon}
          <Text lineClamp={1}>{children}</Text>
        </>
      );
    };

    return (
      <StyledButton
        aria-busy={isLoading ? true : undefined}
        aria-disabled={visuallyDisabled || isLoading ? true : undefined}
        data-button=""
        data-fit-container={isFitContainer ? "" : undefined}
        data-icon-position={iconPosition === "start" ? undefined : "end"}
        data-loading={isLoading ? "" : undefined}
        data-variant={variant}
        ref={ref}
        {...rest}
      >
        {renderChildren()}
      </StyledButton>
    );
  },
);

/**
 * This hook is used to disable all click/press events on a button
 * when the button is visually disabled
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
      onPressUp: undefined,
      onKeyDown: undefined,
      onKeyUp: undefined,
    };
  }

  return computedProps;
};
