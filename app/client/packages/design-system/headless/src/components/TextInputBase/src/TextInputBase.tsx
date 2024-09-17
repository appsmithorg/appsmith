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
    errorMessageProps,
    fieldClassName,
    inputClassName,
    inputProps,
    inputRef: userInputRef,
    isDisabled = false,
    isLoading = false,
    isReadOnly = false,
    labelProps,
    multiLine = false,
    onBlur,
    onFocus,
    prefix,
    suffix,
    validationState,
  } = props;

  // Readonly has a higher priority than disabled.
  const getDisabledState = () => isDisabled && !isReadOnly;

  const { hoverProps, isHovered } = useHover({
    isDisabled: getDisabledState(),
  });
  const domRef = useRef<HTMLDivElement>(null);
  const defaultInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const inputRef = userInputRef ?? defaultInputRef;

  const ElementType: React.ElementType = Boolean(multiLine)
    ? "textarea"
    : "input";
  const isInvalid =
    validationState === "invalid" &&
    !Boolean(isDisabled) &&
    !Boolean(isReadOnly);

  const { focusProps, isFocused, isFocusVisible } = useFocusRing({
    isTextInput: true,
    autoFocus,
  });

  const { focusableProps } = useFocusable(
    { isDisabled: getDisabledState(), onFocus: onFocus, onBlur: onBlur },
    inputRef,
  );

  // When user clicks on the startIcon or endIcon, we want to focus the input.
  const focusInput: React.MouseEventHandler = () => {
    inputRef.current?.focus();
  };

  return (
    <Field
      {...props}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      labelProps={labelProps}
      ref={domRef}
      wrapperClassName={fieldClassName}
    >
      <div
        aria-busy={isLoading ? true : undefined}
        data-disabled={getDisabledState() ? "" : undefined}
        data-field-input=""
        data-focused={
          isFocusVisible || (isFocused && !isReadOnly) ? "" : undefined
        }
        data-hovered={isHovered ? "" : undefined}
        data-invalid={isInvalid ? "" : undefined}
        data-loading={isLoading ? "" : undefined}
        data-readonly={isReadOnly ? "" : undefined}
        onClick={focusInput}
        ref={ref}
      >
        {Boolean(prefix) && <span data-field-input-prefix>{prefix}</span>}
        <ElementType
          {...mergeProps(inputProps, hoverProps, focusProps, focusableProps)}
          className={inputClassName}
          disabled={getDisabledState()}
          readOnly={isReadOnly}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={inputRef as any}
          rows={multiLine ? 1 : undefined}
        />
        {Boolean(suffix) && <span data-field-input-suffix>{suffix}</span>}
      </div>
    </Field>
  );
}

const _TextInputBase = forwardRef(TextInputBase);

export { _TextInputBase as TextInputBase };
