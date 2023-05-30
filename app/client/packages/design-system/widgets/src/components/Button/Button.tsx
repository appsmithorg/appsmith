import React, { forwardRef } from "react";
import { Icon as HeadlessIcon } from "@design-system/headless";
import type {
  ButtonProps as HeadlessButtonProps,
  ButtonRef as HeadlessButtonRef,
} from "@design-system/headless";

import { Text } from "../Text";
import { Spinner } from "../Spinner";
import { StyledButton } from "./index.styled";
import type { fontFamilyTypes } from "../../utils/typography";

export type ButtonVariants = "primary" | "secondary" | "tertiary";

export interface ButtonProps extends Omit<HeadlessButtonProps, "className"> {
  /**
   *  @default primary
   */
  variant?: ButtonVariants;
  fontFamily?: fontFamilyTypes;
  isFitContainer?: boolean;
  isLoading?: boolean;
  isFocused?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
}

export const Button = forwardRef(
  (props: ButtonProps, ref: HeadlessButtonRef) => {
    const {
      children,
      fontFamily,
      icon,
      iconPosition = "start",
      isFitContainer = false,
      isLoading,
      // eslint-disable-next-line -- TODO add onKeyUp when the bug is fixed https://github.com/adobe/react-spectrum/issues/4350
      onKeyUp,
      variant = "primary",
      ...rest
    } = props;

    const renderChildren = () => {
      if (isLoading) {
        return (
          <HeadlessIcon>
            <Spinner />
          </HeadlessIcon>
        );
      }

      return (
        <>
          {icon}
          <Text fontFamily={fontFamily} lineClamp={1}>
            {children}
          </Text>
        </>
      );
    };

    return (
      <StyledButton
        aria-busy={isLoading ? true : undefined}
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
