import React, { forwardRef } from "react";
import { useFocusRing } from "@react-aria/focus";
import { useTextField } from "@react-aria/textfield";
import clsx from "classnames";

import type { InputProps } from "./Input.types";
import {
  Description,
  Error,
  Label,
  MainContainer,
  StyledInput,
  InputSection,
  InputContainer,
} from "./Input.styles";
import { useDOMRef } from "../__hooks__/useDomRef";
import { Icon } from "../Icon";
import {
  InputClassName,
  InputLabelClassName,
  InputSectionClassName,
  InputSectionInputClassName,
  InputEndIconClassName,
  InputIconClassName,
  InputStartIconClassName,
} from "./Input.constants";

const Input = forwardRef<HTMLInputElement, InputProps>(
  (props, ref): JSX.Element => {
    let { isValid } = props;
    const {
      className,
      description,
      disableTextInput = false,
      endIcon,
      endIconProps,
      errorMessage,
      isDisabled = false,
      isReadOnly = false,
      isRequired = false,
      label,
      labelPosition = "top",
      onChange,
      renderAs = "input",
      size = "sm",
      startIcon,
      startIconProps,
      type = "text",
      UNSAFE_height,
      UNSAFE_width,
      value,
      ...rest
    } = props;
    const inputRef = useDOMRef(ref);
    const { descriptionProps, errorMessageProps, inputProps, labelProps } =
      // @ts-expect-error fix this the next time the file is edited
      useTextField(props, inputRef);
    const { focusProps, isFocusVisible } = useFocusRing();
    const {
      className: startIconClassName,
      onClick: startIconOnClick,
      ...restOfStartIconProps
    } = startIconProps || {};
    const {
      className: endIconClassName,
      onClick: endIconOnClick,
      ...restOfEndIconProps
    } = endIconProps || {};

    const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.value);
    };

    isValid = isValid === undefined ? !errorMessage : isValid;

    return (
      <MainContainer
        className={clsx(InputClassName, className)}
        component={renderAs}
        labelPosition={labelPosition}
        size={size}
      >
        {/* TODO: replace this with text component */}
        {/* Issue: adding kind while implementing
        text is throwing typescript error.
        https://stackoverflow.com/questions/68073958/cant-use-href-with-iconbuttonprops*/}
        {label && (
          <Label
            {...labelProps}
            className={InputLabelClassName}
            onClick={(e) => e.preventDefault()}
          >
            {label}
            {/* Show required star only if label is present */}
            {label && isRequired && <span>*</span>}
          </Label>
        )}
        <InputSection className={InputSectionClassName}>
          <InputContainer isDisabled={isDisabled || isReadOnly}>
            {/* Start Icon Section */}
            {startIcon && renderAs === "input" ? (
              <Icon
                className={clsx(
                  InputIconClassName,
                  InputStartIconClassName,
                  startIconClassName,
                )}
                data-has-onclick={!!startIconOnClick}
                name={startIcon}
                onClick={startIconOnClick}
                size={size}
                {...restOfStartIconProps}
              />
            ) : null}
            {/* Input Section */}
            <StyledInput
              as={renderAs}
              type={type}
              {...focusProps}
              {...inputProps}
              UNSAFE_height={UNSAFE_height}
              UNSAFE_width={UNSAFE_width}
              className={InputSectionInputClassName}
              data-is-valid={isValid}
              disabled={disableTextInput || isDisabled}
              hasEndIcon={!!endIcon}
              hasStartIcon={!!startIcon}
              inputSize={size}
              isFocusVisible={isFocusVisible}
              onChange={handleOnChange}
              readOnly={isReadOnly}
              ref={inputRef}
              renderer={renderAs}
              value={value}
              {...rest}
            />
            {/* End Icon Section */}
            {endIcon && renderAs === "input" ? (
              <Icon
                className={clsx(
                  InputIconClassName,
                  InputEndIconClassName,
                  endIconClassName,
                )}
                data-has-onclick={!!endIconOnClick}
                name={endIcon}
                onClick={endIconOnClick}
                size={size}
                {...restOfEndIconProps}
              />
            ) : null}
          </InputContainer>
          {description && (
            <Description
              {...descriptionProps}
              color="var(--ads-v2-colors-control-helper-default-fg)"
              kind="body-s"
              style={
                isDisabled ? { opacity: "var(--ads-v2-opacity-disabled)" } : {}
              }
            >
              {description}
            </Description>
          )}
          {errorMessage && (
            <Error
              {...errorMessageProps}
              color="var(--ads-v2-colors-control-helper-error-fg)"
              kind="body-s"
            >
              {errorMessage}
            </Error>
          )}
        </InputSection>
      </MainContainer>
    );
  },
);

Input.displayName = "Input";

export { Input };
