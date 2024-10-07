import clsx from "clsx";
import {
  FieldError,
  FieldLabel,
  FieldDescription,
  inputFieldStyles,
  IconButton,
  TextAreaInput,
} from "@appsmith/wds";
import React, { useCallback, useRef } from "react";
import { useControlledState } from "@react-stately/utils";
import { chain, useLayoutEffect } from "@react-aria/utils";
import { TextField as HeadlessTextField } from "react-aria-components";

import type { ChatInputProps } from "./types";

export function ChatInput(props: ChatInputProps) {
  const {
    contextualHelp,
    description,
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
  const [inputValue, setInputValue] = useControlledState(
    props.value,
    props.defaultValue ?? "",
    () => {
      //
    },
  );

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
      return <IconButton icon="player-stop-filled" isDisabled size="small" />;
    }

    return <IconButton icon="arrow-up" size="small" />;
  })();

  return (
    <HeadlessTextField
      {...rest}
      className={clsx(inputFieldStyles.field)}
      isDisabled={Boolean(isDisabled) || Boolean(isLoading)}
      isInvalid={isInvalid}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      onChange={chain(onChange, setInputValue)}
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
        suffix={suffix}
        value={value}
      />
      {Boolean(description) && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {Boolean(errorMessage) && <FieldError>{errorMessage}</FieldError>}
    </HeadlessTextField>
  );
}
