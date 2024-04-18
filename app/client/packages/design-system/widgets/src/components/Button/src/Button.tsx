import React, { forwardRef } from "react";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import { Button as HeadlessButton } from "@design-system/headless";
import type { ButtonRef as HeadlessButtonRef } from "@design-system/headless";
import type { SIZES } from "../../../shared";
import clsx from "clsx";
import { Text } from "../../Text";
import { Spinner } from "../../Spinner";
import styles from "./styles.module.css";
import type { ButtonProps } from "./types";
import { Icon } from "../../Icon";

const _Button = (props: ButtonProps, ref: HeadlessButtonRef) => {
  props = useVisuallyDisabled(props);
  const {
    children,
    color = "accent",
    icon,
    iconPosition = "start",
    isDisabled = false,
    isLoading = false,
    loadingText = "Loading...",
    size = "medium",
    // eslint-disable-next-line -- TODO add onKeyUp when the bug is fixed https://github.com/adobe/react-spectrum/issues/4350
    onKeyUp,
    variant = "filled",
    visuallyDisabled = false,
    className,
    ...rest
  } = props;
  const { visuallyHiddenProps } = useVisuallyHidden();

  const renderChildren = () => {
    return (
      <>
        <span aria-hidden={isLoading ? true : undefined} data-content="">
          {icon && <Icon name={icon} size={size as keyof typeof SIZES} />}
          {Boolean(children) && (
            <Text
              data-text=""
              fontWeight={600}
              lineClamp={1}
              textAlign="center"
            >
              {children}
            </Text>
          )}
          {/*
            To align buttons in the case when we don't have text content, we create an empty block with the appropriate size.
            See the styles for data-empty-text attribute.
           */}
          {!Boolean(children) && <Text data-empty-text="">&#8203;</Text>}
        </span>

        {isLoading && (
          <span aria-hidden={!isLoading ? true : undefined} data-loader="">
            <Spinner />
            <span {...visuallyHiddenProps}>{loadingText}</span>
          </span>
        )}
      </>
    );
  };

  return (
    <HeadlessButton
      aria-busy={isLoading ? true : undefined}
      aria-disabled={
        visuallyDisabled || isLoading || isDisabled ? true : undefined
      }
      className={clsx(className, styles.button)}
      data-button=""
      data-color={color}
      data-icon-position={iconPosition === "start" ? "start" : "end"}
      data-loading={isLoading ? "" : undefined}
      data-size={Boolean(size) ? size : undefined}
      data-variant={variant}
      draggable
      isDisabled={isDisabled}
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
  const { isLoading = false, visuallyDisabled = false } = props;
  let computedProps = props;

  if (visuallyDisabled || isLoading) {
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
