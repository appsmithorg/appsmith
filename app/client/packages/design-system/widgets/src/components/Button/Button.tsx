import React, { forwardRef } from "react";
import { Text } from "../Text";
import { Spinner } from "../Spinner";
import { StyledButton } from "./index.styled";
import type { fontFamilyTypes } from "../../utils/typography";
import type {
  ButtonProps as HeadlessButtonProps,
  ButtonRef as HeadlessButtonRef,
} from "@design-system/headless";

export type ButtonVariants = "primary" | "secondary" | "tertiary";

export interface ButtonProps extends Omit<HeadlessButtonProps, "className"> {
  /**
   *  @default primary
   */
  variant?: ButtonVariants;
  children?: React.ReactNode;
  isDisabled?: boolean;
  isLoading?: boolean;
  fontFamily?: fontFamilyTypes;
  isFitContainer?: boolean;
}

export const Button = forwardRef(
  (props: ButtonProps, ref: HeadlessButtonRef) => {
    const {
      children,
      fontFamily,
      isActive,
      isDisabled,
      isFitContainer = false,
      isHover,
      isLoading,
      onBlur,
      onFocus,
      onFocusChange,
      onKeyDown,
      onKeyUp,
      onPress,
      onPressChange,
      onPressEnd,
      onPressStart,
      onPressUp,
      variant = "primary",
    } = props;

    return (
      <StyledButton
        data-fit-container={isFitContainer}
        data-loading={isLoading}
        data-variant={variant}
        isActive={isActive}
        isDisabled={isDisabled}
        isHover={isHover}
        onBlur={onBlur}
        onFocus={onFocus}
        onFocusChange={onFocusChange}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onPress={onPress}
        onPressChange={onPressChange}
        onPressEnd={onPressEnd}
        onPressStart={onPressStart}
        onPressUp={onPressUp}
        ref={ref}
      >
        {isLoading && <Spinner />}

        {!isLoading && (
          <Text fontFamily={fontFamily} lineClamp={1}>
            {children}
          </Text>
        )}
      </StyledButton>
    );
  },
);
