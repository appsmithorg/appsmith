import clsx from "clsx";
import {
  FieldError,
  FieldLabel,
  inputFieldStyles,
  IconButton,
  TextAreaInput,
} from "@appsmith/wds";
import React, { useCallback, useRef, useEffect, useState } from "react";
import { useControlledState } from "@react-stately/utils";
import { chain, useLayoutEffect } from "@react-aria/utils";
import { TextField as HeadlessTextField } from "react-aria-components";

import type { ChatInputProps } from "./types";

export function ChatInput(props: ChatInputProps) {
  const {
    contextualHelp,
    errorMessage,
    isDisabled,
    isInvalid,
    isLoading,
    isReadOnly,
    isRequired,
    label,
    onChange,
    onSubmit,
    prefix,
    suffix: suffixProp,
    value,
    ...rest
  } = props;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [initialHeight, setInitialHeight] = useState<number | null>(null);
  const [inputValue, setInputValue] = useControlledState(
    props.value,
    props.defaultValue ?? "",
    () => {
      //
    },
  );

  useEffect(() => {
    if (inputRef.current && initialHeight === null) {
      const input = inputRef.current;
      const computedStyle = window.getComputedStyle(input);
      const height = parseFloat(computedStyle.height) || 0;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;

      setInitialHeight(height + paddingTop + paddingBottom);
    }
  }, [initialHeight]);

  const onHeightChange = useCallback(() => {
    // Quiet textareas always grow based on their text content.
    // Standard textareas also grow by default, unless an explicit height is set.
    if (props.height == null && inputRef.current) {
      const input = inputRef.current;
      const prevAlignment = input.style.alignSelf;
      const prevOverflow = input.style.overflow;
      // Firefox scroll position is lost when overflow: 'hidden' is applied so we skip applying it.
      // The measure/applied height is also incorrect/reset if we turn on and off
      // overflow: hidden in Firefox https://bugzilla.mozilla.org/show_bug.cgi?id=1787062
      const isFirefox = "MozAppearance" in input.style;

      if (!isFirefox) {
        input.style.overflow = "hidden";
      }

      input.style.alignSelf = "start";
      input.style.height = "auto";

      const computedStyle = window.getComputedStyle(input);
      const height = parseFloat(computedStyle.height) || 0;
      const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
      const textHeight = input.scrollHeight - paddingTop - paddingBottom + 1;

      if (Math.abs(textHeight - height) > 10) {
        input.style.height = `${textHeight}px`;
      } else {
        input.style.height = "auto";
      }

      input.style.overflow = prevOverflow;
      input.style.alignSelf = prevAlignment;
    }
  }, [inputRef, props.height]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onSubmit?.();
      }
    },
    [onSubmit],
  );

  useLayoutEffect(() => {
    if (inputRef.current) {
      onHeightChange();
    }
  }, [onHeightChange, inputValue]);

  const suffix = (function () {
    if (Boolean(suffixProp)) return suffixProp;

    if (Boolean(isLoading)) {
      return (
        <IconButton
          icon="player-stop-filled"
          isDisabled={isDisabled}
          onPress={onSubmit}
        />
      );
    }

    return (
      <IconButton icon="arrow-up" isDisabled={isDisabled} onPress={onSubmit} />
    );
  })();

  const styles = {
    // The --input-height is required to make the icon button vertically centered.
    // Why can't we do this with CSS? Reason is that the height of the input is calculated based on the content.
    "--input-height": Boolean(initialHeight) ? `${initialHeight}px` : "auto",
  } as React.CSSProperties;

  return (
    <HeadlessTextField
      {...rest}
      className={clsx(inputFieldStyles.field)}
      isDisabled={Boolean(isDisabled)}
      isInvalid={isInvalid}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      onChange={chain(onChange, setInputValue)}
      style={styles}
      value={value}
    >
      <FieldLabel
        contextualHelp={contextualHelp}
        isDisabled={isDisabled}
        isRequired={isRequired}
      >
        {label}
      </FieldLabel>
      <TextAreaInput
        isReadOnly={isReadOnly}
        onKeyDown={handleKeyDown}
        prefix={prefix}
        ref={inputRef}
        rows={1}
        size="large"
        suffix={suffix}
        value={value}
      />
      <FieldError>{errorMessage}</FieldError>
    </HeadlessTextField>
  );
}
