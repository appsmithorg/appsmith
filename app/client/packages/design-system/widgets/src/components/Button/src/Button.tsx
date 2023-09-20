import type {
  ButtonRef as HeadlessButtonRef,
  ButtonProps as HeadlessButtonProps,
} from "@design-system/headless";
import classNames from "classnames";
import React, { forwardRef } from "react";
import {
  Button as HeadlessButton,
  Icon as HeadlessIcon,
} from "@design-system/headless";
import { useVisuallyHidden } from "@react-aria/visually-hidden";

import type {
  BUTTON_COLORS,
  BUTTON_VARIANTS,
  BUTTON_ICON_POSITIONS,
} from "./types";
import { Text } from "../../Text";
import { Spinner } from "../../Spinner";
import styles from "./styles.module.css";
import { getTypographyClassName } from "@design-system/theming";

export interface ButtonProps extends HeadlessButtonProps {
  /** variant of the button
   * @default filled
   */
  variant?: (typeof BUTTON_VARIANTS)[keyof typeof BUTTON_VARIANTS];
  /** Color tone of the button
   * @default accent
   */
  color?: (typeof BUTTON_COLORS)[keyof typeof BUTTON_COLORS];
  /** Indicates the loading state of the button */
  isLoading?: boolean;
  /** Icon to be used in the button of the button */
  icon?: React.ComponentType;
  /** Indicates the position of icon of the button
   * @default accent
   */
  iconPosition?: (typeof BUTTON_ICON_POSITIONS)[keyof typeof BUTTON_ICON_POSITIONS];
  /** Makes the button visually and functionaly disabled but focusable */
  visuallyDisabled?: boolean;
  /** Indicates the loading text that will be used by screen readers
   * when the button is in loading state
   * @default Loading...
   */
  loadingText?: string;
}

const _Button = (props: ButtonProps, ref: HeadlessButtonRef) => {
  props = useVisuallyDisabled(props);
  const {
    children,
    color = "accent",
    icon: Icon,
    iconPosition = "start",
    isLoading,
    loadingText = "Loading...",
    // eslint-disable-next-line -- TODO add onKeyUp when the bug is fixed https://github.com/adobe/react-spectrum/issues/4350
    onKeyUp,
    variant = "filled",
    visuallyDisabled,
    ...rest
  } = props;
  const { visuallyHiddenProps } = useVisuallyHidden();

  const renderChildren = () => {
    return (
      <>
        <span aria-hidden={isLoading ? true : undefined} data-content="">
          {Icon && (
            <HeadlessIcon>
              <Icon />
            </HeadlessIcon>
          )}
          {children && (
            <Text fontWeight={600} lineClamp={1} textAlign="center">
              {children}
            </Text>
          )}
        </span>

        <span aria-hidden={!isLoading ? true : undefined} data-loader="">
          <Spinner />
          <span {...visuallyHiddenProps}>{loadingText}</span>
        </span>
      </>
    );
  };

  return (
    <HeadlessButton
      aria-busy={isLoading ? true : undefined}
      aria-disabled={
        visuallyDisabled || isLoading || props.isDisabled ? true : undefined
      }
      className={classNames(styles.button, getTypographyClassName("body"))}
      data-button=""
      data-color={color}
      data-icon-position={iconPosition === "start" ? "start" : "end"}
      data-loading={isLoading ? "" : undefined}
      data-variant={variant}
      draggable
      ref={ref}
      {...rest}
    >
      {renderChildren()}
      <span aria-hidden="true" className={styles.dragContainer} />
    </HeadlessButton>
  );
};

export const Button = forwardRef(_Button);

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
