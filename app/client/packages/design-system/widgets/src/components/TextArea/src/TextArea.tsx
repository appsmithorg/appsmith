import clsx from "clsx";
import {
  FieldError,
  FieldLabel,
  inputFieldStyles,
  TextAreaInput,
} from "@appsmith/wds";
import React, { useCallback, useRef, useEffect, useState } from "react";
import { useControlledState } from "@react-stately/utils";
import { chain, useLayoutEffect } from "@react-aria/utils";
import { TextField as HeadlessTextField } from "react-aria-components";
import { useDebounceCallback, useResizeObserver } from "usehooks-ts";

import type { TextAreaProps } from "./types";

// usehooks-ts does not export Size type, so declare it ourselves
interface Size {
  width?: number;
}

export function TextArea(props: TextAreaProps) {
  const {
    contextualHelp,
    "data-testid": dataTestId,
    errorMessage,
    fieldClassName,
    inputClassName,
    isDisabled,
    isInvalid,
    isLoading,
    isReadOnly,
    isRequired,
    label,
    maxRows,
    onChange,
    rows = 3,
    size,
    suffix,
    value,
    ...rest
  } = props;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useControlledState(
    props.value,
    props.defaultValue ?? "",
    () => {},
  );

  const [textFieldHeight, setTextFieldHeight] = useState<number | null>(null);

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

      const computedStyle = getComputedStyle(input);
      const height = parseFloat(computedStyle.height) || 0;
      const marginTop = parseFloat(computedStyle.marginTop);
      const marginBottom = parseFloat(computedStyle.marginBottom);

      setTextFieldHeight(height + marginTop + marginBottom);

      input.style.height = `${input.scrollHeight + 1}px`;
      input.style.overflow = prevOverflow;
      input.style.alignSelf = prevAlignment;

      if (input.scrollHeight > input.clientHeight) {
        input.setAttribute("data-has-scrollbar", "true");
      } else {
        input.removeAttribute("data-has-scrollbar");
      }
    }
  }, [props.height]);

  useLayoutEffect(() => {
    if (inputRef.current) {
      onHeightChange();
    }
  }, [onHeightChange, inputValue]);

  const [{ width }, setSize] = useState<Size>({
    width: undefined,
  });

  const onResize = useDebounceCallback(setSize, 200);

  useResizeObserver({
    ref: inputRef,
    onResize,
  });

  useEffect(
    function updateHeight() {
      onHeightChange();
    },
    [width],
  );

  const styles = {
    // The --input-height it may be useful to align the prefix or suffix.
    // Why can't we do this with CSS? Reason is that the height of the input is calculated based on the content.
    "--input-height": Boolean(textFieldHeight)
      ? `${textFieldHeight}px`
      : "auto",
    "--max-height": Boolean(maxRows)
      ? `calc(${maxRows} * var(--body-line-height))`
      : "none",
  } as React.CSSProperties;

  return (
    <HeadlessTextField
      {...rest}
      className={clsx(inputFieldStyles.field, fieldClassName)}
      isDisabled={isDisabled}
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
        className={inputClassName}
        data-testid={dataTestId}
        isLoading={isLoading}
        isReadOnly={isReadOnly}
        ref={inputRef}
        rows={rows}
        size={size}
        suffix={suffix}
        value={value}
      />

      <FieldError>{errorMessage}</FieldError>
    </HeadlessTextField>
  );
}
