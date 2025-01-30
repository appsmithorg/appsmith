import clsx from "clsx";
import type { SIZES } from "@appsmith/wds";
import type { ForwardedRef } from "react";
import React, { forwardRef } from "react";
import { Text, Spinner, Icon } from "@appsmith/wds";
import { useVisuallyHidden } from "@react-aria/visually-hidden";
import { Button as HeadlessButton } from "react-aria-components";

import styles from "./styles.module.css";
import type { ButtonProps } from "./types";

const _Button = (props: ButtonProps, ref: ForwardedRef<HTMLButtonElement>) => {
  props = useVisuallyDisabled(props);
  const {
    children,
    className,
    color = "accent",
    icon,
    iconPosition = "start",
    isDisabled = false,
    isLoading = false,
    loadingText = "Loading...",
    size = "medium",
    variant = "filled",
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
              fontWeight={500}
              lineClamp={1}
              size={size === "xSmall" ? "footnote" : "body"}
            >
              {children}
            </Text>
          )}
          {/*
            To align buttons in the case when we don't have text content, we create an empty block with the appropriate size.
            See the styles for data-empty-text attribute.
           */}
          {!Boolean(children) && (
            <Text
              data-empty-text=""
              size={size === "xSmall" ? "footnote" : "body"}
            >
              &#8203;
            </Text>
          )}
        </span>

        {isLoading && (
          <span aria-hidden={!isLoading ? true : undefined} data-loader="">
            <Spinner size={size} />
            <span {...visuallyHiddenProps}>{loadingText}</span>
          </span>
        )}
      </>
    );
  };

  return (
    <HeadlessButton
      className={clsx(className, styles.button)}
      data-button=""
      data-color={color}
      data-icon-position={iconPosition === "start" ? "start" : "end"}
      data-loading={isLoading ? "" : undefined}
      data-size={Boolean(size) ? size : undefined}
      data-variant={variant}
      isDisabled={isDisabled}
      ref={ref}
      {...rest}
    >
      {renderChildren()}
    </HeadlessButton>
  );
};

export const Button = forwardRef(_Button);

/**
 * This hook is used to disable all click/press events on a button
 * when the button is visually disabled
 */
const useVisuallyDisabled = (props: ButtonProps) => {
  const { isLoading = false } = props;
  let computedProps = props;

  if (isLoading) {
    computedProps = {
      ...props,
      isDisabled: false,
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
