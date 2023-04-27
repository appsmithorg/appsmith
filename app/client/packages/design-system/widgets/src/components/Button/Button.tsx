import React, { forwardRef } from "react";
import type { ReactElement } from "react";
import type {
  ButtonProps as HeadlessButtonProps,
  ButtonRef as HeadlessButtonRef,
} from "@design-system/headless";
import { Icon as HeadlessIcon } from "@design-system/headless";

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
  isLoading?: boolean;
  fontFamily?: fontFamilyTypes;
  isFitContainer?: boolean;
  isFocused?: boolean;
  icon?: ReactElement;
  iconPosition?: "start" | "end";
}

export const Button = forwardRef(
  (props: ButtonProps, ref: HeadlessButtonRef) => {
    const {
      children,
      fontFamily,
      icon,
      isFitContainer = false,
      isFocused,
      isLoading,
      // eslint-disable-next-line -- TODO add onKeyUp when the bug is fixedhttps://github.com/adobe/react-spectrum/issues/4350
      onKeyUp,
      variant = "primary",
      ...rest
    } = props;

    const renderChildren = () => {
      if (isLoading) {
        return <Spinner />;
      }

      return (
        <>
          {icon && <HeadlessIcon className="icon">{icon}</HeadlessIcon>}
          <Text fontFamily={fontFamily} lineClamp={1}>
            {children}
          </Text>
        </>
      );
    };

    return (
      <StyledButton
        data-fit-container={isFitContainer}
        data-focus={isFocused}
        data-loading={isLoading}
        data-variant={variant}
        ref={ref}
        {...rest}
      >
        {renderChildren()}
      </StyledButton>
    );
  },
);
