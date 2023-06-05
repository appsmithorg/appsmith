import React, { forwardRef } from "react";
import { useVisuallyHidden } from "@react-aria/visually-hidden";

import { Text } from "../Text";
import type {
  ButtonProps as HeadlessButtonProps,
  ButtonRef as HeadlessButtonRef,
} from "@design-system/headless";
import { Spinner } from "../Spinner";
import { StyledButton, DragContainer } from "./index.styled";
import type { fontFamilyTypes } from "../../utils/typography";
import { Icon as HeadlessIcon } from "@design-system/headless";

export const BUTTON_ICON_POSITIONS = ["start", "end"] as const;
export const BUTTON_VARIANTS = {
  primary: "primary",
  secondary: "secondary",
  tertiary: "tertiary",
} as const;

// Note(Pawan): Should we use ts-toolbelt?
export type ButtonVariant =
  (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];
export type ButtonIconPosition = (typeof BUTTON_ICON_POSITIONS)[number];

export interface ButtonProps extends Omit<HeadlessButtonProps, "className"> {
  /**
   * variant of the button
   *
   *  @default primary
   */
  variant?: ButtonVariant;
  fontFamily?: fontFamilyTypes;
  /** when true, makes the button occupy all the space available
   *
   * @default false
   */
  isFitContainer?: boolean;
  /** indicates the loadoing state of the button
   *
   * @default false
   */
  isLoading?: boolean;
  /** icon to be used in the button of the button
   *
   * @default undefined
   */
  icon?: React.ReactNode;
  /** Indicates the position of icon of the button
   *
   * @default start
   */
  iconPosition?: "start" | "end";
  /** when true, makes the button visually disabled but focusable
   *
   * @default false
   */
  visuallyDisabled?: boolean;
}

export const Button = forwardRef(
  (props: ButtonProps, ref: HeadlessButtonRef) => {
    props = useVisuallyDisabled(props);
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
            {/* TODO(pawan): How make sure "Loading..." is internationalized? */}
            <span {...visuallyHiddenProps}>Loading...</span>
          </>
        );
      }

      return (
        <>
          {icon}
          {typeof children === "string" ? (
            <Text fontFamily={fontFamily} lineClamp={1}>
              {children}
            </Text>
          ) : (
            children
          )}
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
        draggable
        ref={ref}
        {...rest}
      >
        {renderChildren()}
        <DragContainer />
      </StyledButton>
    );
  },
);

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
      onPressUp: undefined,
      onKeyDown: undefined,
      onKeyUp: undefined,
    };
  }

  return computedProps;
};
