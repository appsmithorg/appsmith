import clsx from "clsx";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  newFieldStyles,
} from "@appsmith/wds";
import React, { useCallback, useRef } from "react";
import { chain, useLayoutEffect } from "@react-aria/utils";
import { useControlledState } from "@react-stately/utils";
import { TextField as AriaTextField } from "react-aria-components";

import type { TextAreaProps } from "./types";

export function TextArea(props: TextAreaProps) {
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
    prefix,
    size = "medium",
    suffix,
    type,
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

      const computedStyle = getComputedStyle(input);
      const paddingTop = parseFloat(computedStyle.paddingTop);
      const paddingBottom = parseFloat(computedStyle.paddingBottom);

      input.style.height = `${
        // subtract comptued padding and border to get the actual content height
        input.scrollHeight -
        paddingTop -
        paddingBottom +
        // Also, adding 1px to fix a bug in browser where there is a scrolllbar on certain heights
        1
      }px`;
      input.style.overflow = prevOverflow;
      input.style.alignSelf = prevAlignment;
    }
  }, [inputRef, props.height]);

  useLayoutEffect(() => {
    if (inputRef.current) {
      onHeightChange();
    }
  }, [onHeightChange, inputValue, inputRef.current]);

  return (
    <AriaTextField
      {...rest}
      className={clsx(newFieldStyles.field)}
      isDisabled={isDisabled}
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
      <Input
        isLoading={isLoading}
        isMultiLine
        isReadOnly={isReadOnly}
        prefix={prefix}
        ref={inputRef}
        size={size}
        suffix={suffix}
        type={type}
        value={value}
      />
      {Boolean(description) && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {Boolean(errorMessage) && <FieldError>{errorMessage}</FieldError>}
    </AriaTextField>
  );
}
