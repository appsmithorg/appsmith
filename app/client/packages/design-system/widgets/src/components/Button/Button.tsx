import type {
  ButtonProps as HeadlessButtonProps,
  ButtonRef as HeadlessButtonRef,
} from "@design-system/headless";
import React, { forwardRef } from "react";
import { Icon as HeadlessIcon } from "@design-system/headless";
import { useVisuallyHidden } from "@react-aria/visually-hidden";

import { Text } from "../Text";
import { Spinner } from "../Spinner";
import { DragContainer, StyledButton } from "./index.styled";

export interface ButtonProps extends Omit<HeadlessButtonProps, "className"> {
  /** variant of the button
   *
   * @default "filled"
   */
  variant?: "filled" | "outlined" | "ghost";
  /** Color tone of the button */
  color?: "accent" | "neutral" | "positive" | "negative" | "warning";
  /** When true, makes the button occupy all the space available */
  isFitContainer?: boolean;
  /** Indicates the loading state of the button */
  isLoading?: boolean;
  /** Icon to be used in the button of the button */
  icon?: React.ReactNode;
  /** Indicates the position of icon of the button */
  iconPosition?: "start" | "end";
  /** Makes the button visually and functionaly disabled but focusable */
  visuallyDisabled?: boolean;
}

export const Button = forwardRef(
  (props: ButtonProps, ref: HeadlessButtonRef) => {
    props = useVisuallyDisabled(props);
    const {
      children,
      color = "accent",
      icon,
      iconPosition = "start",
      isFitContainer = false,
      isLoading,
      // eslint-disable-next-line -- TODO add onKeyUp when the bug is fixed https://github.com/adobe/react-spectrum/issues/4350
      onKeyUp,
      variant = "filled",
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
            {/* TODO(pawan): How to make sure "Loading..." text is internationalized? */}
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
        aria-disabled={
          visuallyDisabled || isLoading || props.isDisabled ? true : undefined
        }
        color={color}
        data-button=""
        data-fit-container={isFitContainer ? "" : undefined}
        data-icon-position={iconPosition === "start" ? undefined : "end"}
        data-loading={isLoading ? "" : undefined}
        data-variant={variant}
        draggable
        ref={ref}
        variant={variant}
        {...rest}
      >
        {renderChildren()}
        <DragContainer data-hidden="" />
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
