import type { Ref } from "react";
import { mergeProps } from "@react-aria/utils";
import React, { forwardRef, useRef } from "react";
import { useHover } from "@react-aria/interactions";
import { useFocusRing, useFocusable } from "@react-aria/focus";

import { Field } from "../../Field";
import type { TextInputBaseProps } from "./types";

function TextInputBase(props: TextInputBaseProps, ref: Ref<HTMLDivElement>) {
  const {
    autoFocus,
    descriptionProps,
    endIcon,
    errorMessageProps,
    fieldClassName,
    inputClassName,
    inputProps,
    inputRef: userInputRef,
    isDisabled = false,
    isLoading = false,
    labelProps,
    multiLine = false,
    onBlur,
    onFocus,
    prefix,
    startIcon,
    suffix,
    validationState,
  } = props;
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const domRef = useRef<HTMLDivElement>(null);
  const defaultInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const inputRef = userInputRef ?? defaultInputRef;

  const ElementType: React.ElementType = Boolean(multiLine)
    ? "textarea"
    : "input";
  const isInvalid = validationState === "invalid" && !Boolean(isDisabled);

  const { focusProps, isFocused, isFocusVisible } = useFocusRing({
    isTextInput: true,
    autoFocus,
  });

  const { focusableProps } = useFocusable(
    { isDisabled, onFocus: onFocus, onBlur: onBlur },
    inputRef,
  );

  // When user clicks on the startIcon or endIcon, we want to focus the input.
  const focusInput: React.MouseEventHandler = () => {
    inputRef.current?.focus();
  };

  const inputField = (
    <div
      aria-busy={isLoading ? true : undefined}
      data-disabled={isDisabled ? "" : undefined}
      data-field-input=""
      data-focused={isFocusVisible || isFocused ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      data-invalid={isInvalid ? "" : undefined}
      data-loading={isLoading ? "" : undefined}
      onClick={focusInput}
      ref={ref}
    >
      {Boolean(startIcon) && (
        <span data-field-input-start-icon="">{startIcon}</span>
      )}
      <ElementType
        {...mergeProps(inputProps, hoverProps, focusProps, focusableProps)}
        className={inputClassName}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={inputRef as any}
        rows={multiLine ? 1 : undefined}
      />
      {Boolean(endIcon) && <span data-field-input-end-icon="">{endIcon}</span>}
    </div>
  );

  return (
    <Field
      {...props}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      labelProps={labelProps}
      ref={domRef}
      wrapperClassName={fieldClassName}
    >
      <div data-field-input-group="">
        {Boolean(prefix) && <span data-field-input-prefix>{prefix}</span>}
        {inputField}
        {Boolean(suffix) && <span data-field-input-suffix>{suffix}</span>}
      </div>
    </Field>
  );
}

const _TextInputBase = forwardRef(TextInputBase);
export { _TextInputBase as TextInputBase };
