import React, { useState, useEffect, forwardRef } from "react";
import clsx from "classnames";

import type { NumberInputProps } from "./NumberInput.types";
import { StyledNumberInput } from "./NumberInput.styles";
import { NumberInputClassName } from "./NumberInput.constants";
import { useDOMRef } from "../__hooks__/useDomRef";
import {
  InputEndIconDisabledClassName,
  InputStartIconDisabledClassName,
} from "../Input/Input.constants";

/**
 * TODO: Number input should actually use input type number.
 */
const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (props, ref) => {
    const inputRef = useDOMRef(ref);
    const {
      className,
      description,
      disableTextInput = false,
      errorMessage,
      isDisabled = false,
      isReadOnly = false,
      isRequired = false,
      label,
      labelPosition = "top",
      max,
      min,
      onChange,
      placeholder = "0",
      prefix = "",
      scale = 1,
      suffix = "",
      ...rest
    } = props;
    const initialValue =
      props.value !== undefined ? prefix + (props.value || "") + suffix : "";
    const [value, setValue] = useState<string>(initialValue);
    const [disableEndIcon, setDisableEndIcon] = useState<boolean>(false);
    const [disableStartIcon, setDisableStartIcon] = useState<boolean>(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        handleChange(value === "" ? "0" : value, "add");
      } else if (e.key === "ArrowDown") {
        handleChange(value === "" ? "0" : value, "subtract");
      }
    };

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.addEventListener("keydown", handleKeyDown);

        return () => {
          inputRef.current?.removeEventListener("keydown", handleKeyDown);
        };
      }
    }, [handleKeyDown]);

    useEffect(() => {
      if (props.value !== undefined) {
        const newValue = handlePrefixAndSuffix(props.value);

        setValue(newValue);
      }
    }, [props.value]);

    useEffect(() => {
      if (value) {
        if (checkMinViolation(value)) {
          /**
           * Disabled Start Icon if max violation is encountered.
           */
          setDisableStartIcon(true);
        } else if (disableStartIcon) {
          /**
           * Enable Start Icon if it had been previously disabled.
           */
          setDisableStartIcon(false);
        }
      }
    }, [value, min]);

    useEffect(() => {
      if (value) {
        if (checkMaxViolation(value)) {
          /**
           * Disabled End Icon if max violation is encountered.
           */
          setDisableEndIcon(true);
        } else if (disableEndIcon) {
          /**
           * Enable End Icon if it had been previously disabled.
           */
          setDisableEndIcon(false);
        }
      }
    }, [value, max]);

    const handlePrefixAndSuffix = (value: string) => {
      let newValue = value;

      if (newValue === "" || newValue === undefined) return "";

      // defensive check to make sure the value is a string
      newValue = newValue.toString();

      if (prefix && !newValue.startsWith(prefix)) {
        newValue = prefix + newValue;
      }

      if (suffix && !newValue.endsWith(suffix)) {
        newValue = newValue + suffix;
      }

      return newValue;
    };

    const handleChange = (_value: string, operation?: "add" | "subtract") => {
      const inputValue = getNumericalValue(_value);

      // Check if the input value is a valid number
      if (!isNaN(inputValue)) {
        let newValue = inputValue;

        // Apply operation on the value
        if (operation === "add") {
          newValue += scale;
        } else if (operation === "subtract") {
          newValue -= scale;
        }

        // Check min and max values
        if (typeof min === "number" && newValue < min) {
          newValue = min;
        }

        if (typeof max === "number" && newValue > max) {
          newValue = max;
        }

        // Convert the value back to a string and append prefix and postfix if present
        let newValueString = String(newValue);

        newValueString = handlePrefixAndSuffix(newValueString);
        setValue(newValueString);
        onChange?.(newValueString);
      } else {
        setValue("");
        onChange?.("");

        return;
      }
    };

    const checkMinViolation = (value: string): boolean => {
      if (typeof min === "number") {
        return getNumericalValue(value) <= min;
      }

      return false;
    };

    const checkMaxViolation = (value: string): boolean => {
      if (typeof max === "number") {
        return getNumericalValue(value) >= max;
      }

      return false;
    };

    const getNumericalValue = (_value: string): number =>
      parseFloat(_value.replace(/[^0-9.-]+/g, ""));

    return (
      <StyledNumberInput
        className={clsx(NumberInputClassName, className)}
        description={description}
        disableTextInput={disableTextInput}
        endIcon="add-line"
        endIconProps={{
          className: clsx(disableEndIcon && InputEndIconDisabledClassName),
          onClick: () =>
            !isDisabled &&
            !isReadOnly &&
            handleChange(value === "" ? "0" : value, "add"),
        }}
        errorMessage={errorMessage}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        isRequired={isRequired}
        label={label}
        labelPosition={labelPosition}
        onChange={(val) =>
          !isDisabled && !disableTextInput && !isReadOnly && handleChange(val)
        }
        placeholder={placeholder}
        ref={inputRef}
        renderAs="input"
        size="md"
        startIcon="subtract-line"
        startIconProps={{
          className: clsx(disableStartIcon && InputStartIconDisabledClassName),
          onClick: () =>
            !isDisabled &&
            !isReadOnly &&
            handleChange(value === "" ? "0" : value, "subtract"),
        }}
        {...rest}
        value={value}
      />
    );
  },
);

NumberInput.displayName = "NumberInput";

NumberInput.defaultProps = {};

export { NumberInput };
