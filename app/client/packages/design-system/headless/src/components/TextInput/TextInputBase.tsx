import type { SpectrumTextFieldProps } from "@react-types/textfield";
import { mergeProps } from "@react-aria/utils";
import { useHover } from "@react-aria/interactions";
import type { PressEvents } from "@react-types/shared";
import type { Ref, RefObject } from "react";
import { useFocusRing, useFocusable } from "@react-aria/focus";
import React, { forwardRef, useRef, useCallback, useState } from "react";

import { Field } from "../Field";
import type { TextFieldAria } from "@react-aria/textfield";

interface TextInputBaseProps
  extends Omit<SpectrumTextFieldProps, "onChange" | "icon">,
    PressEvents {
  /** classname for the input element */
  inputClassName?: string;
  /** indicates if the component is textarea */
  multiLine?: boolean;
  /** props to be passed to label component */
  labelProps?: TextFieldAria["labelProps"];
  /** props to be passed to input component */
  inputProps: TextFieldAria<"input" | "textarea">["inputProps"];
  /** props to be passed to description component */
  descriptionProps?: TextFieldAria["descriptionProps"];
  /** props to be passed to error component */
  errorMessageProps?: TextFieldAria["errorMessageProps"];
  /** ref for input component */
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement>;
  /** indicates loading state of the text input */
  isLoading?: boolean;
  /** className for the text input. */
  className?: string;
  /**an icon to be displayed at the start of the component  */
  startIcon?: React.ReactNode;
  /** an icon to be displayed at the end of the component */
  endIcon?: React.ReactNode;
  /**position of the loading icon */
  loaderPosition?: "start" | "end" | "auto";
  /** icon to be used when isLoading is true */
  loadingIcon?: React.ReactNode;
}

function TextInputBase(props: TextInputBaseProps, ref: Ref<HTMLDivElement>) {
  const {
    autoFocus,
    className,
    descriptionProps,
    endIcon: endIconProp,
    errorMessageProps,
    inputClassName,
    inputProps,
    inputRef: userInputRef,
    isDisabled,
    isLoading,
    labelProps,
    loaderPosition = "auto",
    loadingIcon,
    multiLine,
    onBlur,
    onFocus,
    startIcon: startIconProp,
    validationState,
  } = props;
  const [isFocussed, setIsFocused] = useState(false);
  const { hoverProps, isHovered } = useHover({ isDisabled });
  const domRef = useRef<HTMLDivElement>(null);
  const defaultInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const inputRef = userInputRef || defaultInputRef;

  const ElementType: React.ElementType = multiLine ? "textarea" : "input";
  const isInvalid = validationState === "invalid" && !isDisabled;

  const { focusProps, isFocusVisible } = useFocusRing({
    isTextInput: true,
    autoFocus,
  });

  // TODO(Pawan): Remove this once has() css selector is available in all browsers
  const handleOnFocus = useCallback(
    (e) => {
      setIsFocused(true);
      onFocus && onFocus(e);
    },
    [onFocus],
  );
  const handleOnBlur = useCallback(
    (e) => {
      setIsFocused(false);
      onBlur && onBlur(e);
    },
    [onBlur],
  );

  const { focusableProps } = useFocusable(
    { isDisabled, onFocus: handleOnFocus, onBlur: handleOnBlur },
    inputRef,
  );

  // When user clicks on the startIcon or endIcon, we want to focus the input.
  const focusInput: React.MouseEventHandler = () => {
    inputRef.current?.focus();
  };

  const startIcon = () => {
    const showLoadingIndicator =
      isLoading &&
      (loaderPosition === "start" ||
        Boolean(startIconProp && loaderPosition !== "end"));

    if (!showLoadingIndicator) return startIconProp;

    return loadingIcon;
  };

  const endIcon = () => {
    const showLoadingIndicator =
      isLoading &&
      (loaderPosition === "end" ||
        Boolean(loaderPosition === "auto" && !startIconProp));

    if (!showLoadingIndicator) return endIconProp;

    return loadingIcon;
  };

  const textField = (
    <div
      data-disabled={isDisabled ? "" : undefined}
      data-field-input-wrapper=""
      data-focused={isFocusVisible || isFocussed ? "" : undefined}
      data-hovered={isHovered ? "" : undefined}
      data-invalid={isInvalid ? "" : undefined}
      data-loading={isLoading ? "" : undefined}
      onClick={focusInput}
      ref={ref}
    >
      {startIcon()}
      <ElementType
        {...mergeProps(inputProps, hoverProps, focusProps, focusableProps)}
        className={inputClassName}
        data-field-input=""
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={inputRef as any}
        rows={multiLine ? 1 : undefined}
      />
      {endIcon()}
    </div>
  );

  return (
    <Field
      {...props}
      descriptionProps={descriptionProps}
      errorMessageProps={errorMessageProps}
      labelProps={labelProps}
      ref={domRef}
      showErrorIcon={false}
      wrapperClassName={className}
    >
      {textField}
    </Field>
  );
}

const _TextInputBase = forwardRef(TextInputBase);
export { _TextInputBase as TextInputBase };
