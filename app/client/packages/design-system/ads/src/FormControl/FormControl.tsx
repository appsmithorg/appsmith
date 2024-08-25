import React from "react";
import clsx from "classnames";

import type {
  FormControlProps,
  FormErrorProps,
  FormHelperProps,
  FormLabelProps,
} from "./FormControl.types";
import {
  StyledError,
  StyledFormControl,
  StyledHelper,
  StyledLabel,
} from "./FormControl.styles";
import {
  FormControlProvider,
  useFormControlContext,
} from "./FormControl.context";
import {
  FormControlClassName,
  FormControlErrorClassName,
  FormControlHelperClassName,
  FormControlLabelClassName,
} from "./FormControl.constants";

function FormControl({
  children,
  className,
  isDisabled,
  isRequired,
  labelPosition = "top",
  size = "sm",
  ...rest
}: FormControlProps) {
  return (
    <FormControlProvider
      value={{
        isDisabled,
        isRequired,
        size,
      }}
    >
      <StyledFormControl
        className={clsx(FormControlClassName, className)}
        data-label-position={labelPosition}
        {...rest}
      >
        {children}
      </StyledFormControl>
    </FormControlProvider>
  );
}

FormControl.displayName = "FormControl";

function FormLabel({ children, className, ...rest }: FormLabelProps) {
  const { isRequired, size } = useFormControlContext();
  return (
    <StyledLabel
      className={clsx(FormControlLabelClassName, className)}
      data-size={size}
      {...rest}
    >
      {children}
      {isRequired && <span>*</span>}
    </StyledLabel>
  );
}

FormLabel.displayName = "FormLabel";

function FormHelper({ children, className, ...rest }: FormHelperProps) {
  const { isDisabled } = useFormControlContext();
  return (
    <StyledHelper
      className={clsx(FormControlHelperClassName, className)}
      color="var(--ads-v2-colors-control-helper-default-fg)"
      data-disabled={isDisabled}
      kind="body-s"
      {...rest}
    >
      {children}
    </StyledHelper>
  );
}

FormHelper.displayName = "FormHelper";

function FormError({ children, className, ...rest }: FormErrorProps) {
  return (
    <StyledError
      className={clsx(FormControlErrorClassName, className)}
      color="var(--ads-v2-colors-control-helper-error-fg)"
      kind="body-s"
      {...rest}
    >
      {children}
    </StyledError>
  );
}

FormError.displayName = "FormError";

export { FormControl, FormLabel, FormHelper, FormError };
