import React, { useCallback } from "react";

import BaseInputField, {
  BaseInputComponentProps,
  parseRegex,
} from "./BaseInputField";
import { BaseFieldComponentProps, FieldType } from "../constants";
import { isNil } from "lodash";

type InputComponentProps = BaseInputComponentProps & {
  iconName?: string;
  iconAlign?: string;
};

export type InputFieldProps = BaseFieldComponentProps<InputComponentProps>;

type IsValidOptions = {
  fieldType: FieldType;
};

const COMPONENT_DEFAULT_VALUES: InputComponentProps = {
  iconAlign: "left",
  isDisabled: false,
  isRequired: false,
  isSpellCheck: false,
  isVisible: true,
  label: "",
};

const EMAIL_REGEX = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);

const getInputHTMLType = (fieldType: FieldType) => {
  switch (fieldType) {
    case FieldType.NUMBER:
      return "NUMBER";
    case FieldType.EMAIL:
      return "EMAIL";
    case FieldType.PASSWORD:
      return "PASSWORD";
    default:
      return "TEXT";
  }
};

const isValid = (
  schemaItem: InputFieldProps["schemaItem"],
  inputValue: string,
) => {
  let hasValidValue, value, isEmpty;
  switch (schemaItem.fieldType) {
    case FieldType.NUMBER:
      try {
        isEmpty = isNil(inputValue);
        value = Number(inputValue);
        hasValidValue = Number.isFinite(value);
        break;
      } catch (e) {
        return false;
      }
    default:
      value = inputValue;
      isEmpty = !value;
      hasValidValue = !!value;
      break;
  }

  if (!schemaItem.isRequired && isEmpty) {
    return true;
  }
  if (schemaItem.isRequired && !hasValidValue) {
    return false;
  }

  if (typeof schemaItem.validation === "boolean" && !schemaItem.validation) {
    return false;
  }

  const parsedRegex = parseRegex(schemaItem.regex);

  switch (schemaItem.fieldType) {
    case FieldType.EMAIL:
      if (!EMAIL_REGEX.test(inputValue)) {
        /* email should conform to generic email regex */
        return false;
      } else if (parsedRegex) {
        /* email should conform to user specified regex */
        return parsedRegex.test(inputValue);
      } else {
        return true;
      }
    case FieldType.NUMBER:
      if (
        !isNil(schemaItem.maxNum) &&
        Number.isFinite(schemaItem.maxNum) &&
        schemaItem.maxNum < value
      ) {
        return false;
      } else if (
        !isNil(schemaItem.minNum) &&
        Number.isFinite(schemaItem.minNum) &&
        schemaItem.minNum > value
      ) {
        return false;
      } else if (parsedRegex) {
        return parsedRegex.test(inputValue);
      } else {
        return hasValidValue;
      }
    default:
      if (parsedRegex) {
        return parsedRegex.test(inputValue);
      } else {
        return hasValidValue;
      }
  }
};

function isValidType(value: string, options?: IsValidOptions) {
  if (options?.fieldType === FieldType.EMAIL && value) {
    return EMAIL_REGEX.test(value);
  }

  return false;
}

function InputField({
  fieldClassName,
  name,
  passedDefaultValue,
  propertyPath,
  schemaItem,
}: InputFieldProps) {
  const transformValue = useCallback(
    (inputValue: string) => {
      let value;
      switch (schemaItem.fieldType) {
        case FieldType.NUMBER:
          try {
            if (inputValue === "") {
              value = null;
            } else if (inputValue === "-") {
              value = "-";
            } else if (/\.$/.test(inputValue)) {
              value = inputValue;
            } else {
              value = Number(inputValue);

              if (isNaN(value)) {
                value = undefined;
              }
            }
            break;
          } catch (e) {
            value = inputValue;
          }
          break;
        default:
          value = inputValue;
          break;
      }

      return {
        text: inputValue,
        value,
      };
    },
    [schemaItem.fieldType],
  );

  return (
    <BaseInputField
      fieldClassName={fieldClassName}
      inputHTMLType={getInputHTMLType(schemaItem.fieldType)}
      isValid={isValid}
      name={name}
      passedDefaultValue={passedDefaultValue}
      propertyPath={propertyPath}
      schemaItem={schemaItem}
      transformValue={transformValue}
    />
  );
}

InputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;
InputField.isValidType = isValidType;

export default InputField;
