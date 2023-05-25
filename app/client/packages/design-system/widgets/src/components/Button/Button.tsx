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
  isFocused?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
}

const LOADING_ICON = (
  <HeadlessIcon>
    <Spinner />
  </HeadlessIcon>
);

export const Button = forwardRef(
  (props: ButtonProps, ref: HeadlessButtonRef) => {
    const {
      children,
      fontFamily,
      icon,
      iconPosition = "start",
      loadingIcon = LOADING_ICON,
      isFitContainer = false,
      // eslint-disable-next-line -- TODO add onKeyUp when the bug is fixed https://github.com/adobe/react-spectrum/issues/4350
      onKeyUp,
      variant = "primary",
      ...rest
    } = props;

    return (
      <StyledButton
        data-button=""
        data-fit-container={isFitContainer ? "" : undefined}
        data-icon-position={iconPosition === "start" ? undefined : "end"}
        data-variant={variant}
        loadingIcon={loadingIcon}
        ref={ref}
        {...rest}
      >
        {icon}
        <Text fontFamily={fontFamily} lineClamp={1}>
          {children}
        </Text>
      </StyledButton>
    );
  },
);
