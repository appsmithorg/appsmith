import React, { forwardRef, Fragment } from "react";

import { Wrapper } from "./index.styled";
import { InputError } from "../InputError";
import { InputLabel } from "../InputLabel";
import { InputDescription } from "../InputDescription";

export interface InputWrapperBaseProps {
  /** Input label, displayed before input */
  label?: React.ReactNode;

  /** Input description, displayed after label */
  description?: React.ReactNode;

  /** Displays error message after input */
  error?: React.ReactNode;

  /** Adds required attribute to the input and red asterisk on the right side of label */
  required?: boolean;

  /** Determines whether required asterisk should be rendered, overrides required prop, does not add required attribute to the input */
  withAsterisk?: boolean;

  /** Props spread to label element */
  labelProps?: Record<string, any>;

  /** Props spread to description element */
  descriptionProps?: Record<string, any>;

  /** Props spread to error element */
  errorProps?: Record<string, any>;

  /** Input container component, defaults to React.Fragment */
  inputContainer?(children: React.ReactNode): React.ReactNode;

  /** Controls order of the Input.Wrapper elements */
  inputWrapperOrder?: ("label" | "input" | "description" | "error")[];

  labelPosition?: "top" | "left";
}

export interface InputWrapperProps
  extends InputWrapperBaseProps,
    React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  id?: string;
  labelElement?: "label" | "div";
}

// Note: InputWrapper is used for inputs that label
export const InputWrapper = forwardRef<HTMLDivElement, InputWrapperProps>(
  (props, ref) => {
    const {
      children,
      description,
      descriptionProps,
      error,
      errorProps,
      id,
      inputContainer = (children) => children,
      inputWrapperOrder = ["label", "description", "input", "error"],
      label,
      labelProps,
      required,
      withAsterisk,
      labelElement = "label",
      labelPosition = "top",
      ...others
    } = props;

    const isRequired =
      typeof withAsterisk === "boolean" ? withAsterisk : required;

    const _label = label && (
      <InputLabel
        data-component="input-label"
        htmlFor={id}
        id={id ? `${id}-label` : undefined}
        key="label"
        labelElement={labelElement}
        {...labelProps}
      >
        {isRequired && (
          <span aria-hidden className="is-required">
            {" *"}
          </span>
        )}
        {label}
      </InputLabel>
    );

    const _description = description && (
      <InputDescription data-component="description" {...descriptionProps}>
        {description}
      </InputDescription>
    );

    const _input = <Fragment key="input">{inputContainer(children)}</Fragment>;

    const _error = typeof error !== "boolean" && error && (
      <InputError {...errorProps} key="error">
        {error}
      </InputError>
    );

    const content = inputWrapperOrder.map((part) => {
      switch (part) {
        case "input":
          return _input;
        case "label":
          return _label;
        case "description":
          return _description;
        case "error":
          return _error;
        default:
          return null;
      }
    });

    return (
      <Wrapper labelPosition={labelPosition} ref={ref} {...others}>
        {content}
      </Wrapper>
    );
  },
);

InputWrapper.displayName = "@mantine/core/InputWrapper";
