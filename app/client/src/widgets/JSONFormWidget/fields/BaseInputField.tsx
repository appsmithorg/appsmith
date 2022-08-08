import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import { Alignment, IconName } from "@blueprintjs/core";
import { isNil } from "lodash";
import { useController } from "react-hook-form";

import Field from "../component/Field";
import FormContext from "../FormContext";
import useEvents from "./useBlurAndFocusEvents";
import useRegisterFieldValidity from "./useRegisterFieldValidity";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  createMessage,
  FIELD_REQUIRED_ERROR,
  INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
  INPUT_TEXT_MAX_CHAR_ERROR,
} from "@appsmith/constants/messages";
import {
  ActionUpdateDependency,
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldEventProps,
  FieldType,
  INPUT_FIELD_TYPE,
  INPUT_TYPES,
  SchemaItem,
} from "../constants";
import BaseInputComponent, {
  InputHTMLType,
} from "widgets/BaseInputWidget/component";
import { BASE_LABEL_TEXT_SIZE } from "../component/FieldLabel";

export type BaseInputComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    borderRadius?: string;
    boxShadow?: string;
    errorMessage?: string;
    iconAlign?: Omit<Alignment, "center">;
    iconName?: IconName;
    isSpellCheck: boolean;
    maxChars?: number;
    maxNum?: number;
    minNum?: number;
    onEnterKeyPress?: string;
    onTextChanged?: string;
    placeholderText?: string;
    accentColor?: string;
    regex?: string;
    validation?: boolean;
  };

export type OnValueChangeOptions = {
  fieldOnChangeHandler: (...event: any[]) => void;
  isValueValid: boolean;
};

type BaseInputFieldProps<
  TSchemaItem extends SchemaItem = SchemaItem
> = BaseFieldComponentProps<BaseInputComponentProps & TSchemaItem> & {
  inputHTMLType?: InputHTMLType;
  leftIcon?: IconName | JSX.Element;
  transformValue: (
    newValue: string,
    oldValue: string,
  ) => { text: string; value?: number | string | null | undefined };
  isValid: (schemaItem: TSchemaItem, value?: string | null) => boolean;
};

type IsValidOptions = {
  fieldType: FieldType;
};

type StyledInputWrapperProps = {
  multiline: boolean;
};

const COMPONENT_DEFAULT_VALUES: BaseInputComponentProps = {
  isDisabled: false,
  isRequired: false,
  isSpellCheck: false,
  isVisible: true,
  labelTextSize: BASE_LABEL_TEXT_SIZE,
  label: "",
};

// This is to compensate the lack of Resizable Component which gives Input widget's height.
const StyledInputWrapper = styled.div<StyledInputWrapperProps>`
  height: ${({ multiline }) => (multiline ? "100px" : "32px")};
  width: 100%;
`;

// REGEX origin https://github.com/manishsaraan/email-validator/blob/master/index.js
export const EMAIL_REGEX = new RegExp(
  /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/,
);

export const parseRegex = (regex?: string) => {
  try {
    if (regex && typeof regex === "string") {
      /*
       * break up the regexp pattern into 4 parts: given regex, regex prefix , regex pattern, regex flags
       * Example /test/i will be split into ["/test/gi", "/", "test", "gi"]
       */
      const regexParts = regex.match(/(\/?)(.+)\1([a-z]*)/i);

      if (!regexParts) {
        return new RegExp(regex);
      } else {
        /*
         * if we don't have a regex flags (gmisuy), convert provided string into regexp directly
         */
        if (
          regexParts[3] &&
          !/^(?!.*?(.).*?\1)[gmisuy]+$/.test(regexParts[3])
        ) {
          return RegExp(regex);
        } else {
          /*
           * if we have a regex flags, use it to form regexp
           */
          return new RegExp(regexParts[2], regexParts[3]);
        }
      }
    }
  } catch (e) {
    return null;
  }

  return null;
};

function isValidType(value: string, options?: IsValidOptions) {
  if (options?.fieldType === FieldType.EMAIL_INPUT && value) {
    return EMAIL_REGEX.test(value);
  }

  return false;
}

function BaseInputField<TSchemaItem extends SchemaItem>({
  fieldClassName,
  inputHTMLType = "TEXT",
  isValid,
  leftIcon,
  name,
  passedDefaultValue,
  schemaItem,
  transformValue,
}: BaseInputFieldProps<TSchemaItem>) {
  const isNilSetByField = useRef(false);
  const { executeAction } = useContext(FormContext);
  const inputDefaultValue = (() => {
    if (passedDefaultValue === undefined) {
      return schemaItem.defaultValue;
    }

    return passedDefaultValue;
  })();

  const [isFocused, setIsFocused] = useState(false);
  const [inputText, setInputText] = useState<string | undefined | null>("");

  const {
    field: { onBlur, onChange, value },
    fieldState: { isDirty },
  } = useController({
    name,
  });

  const {
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;

  useEffect(() => {
    const stringifiedValue = isNil(inputDefaultValue)
      ? inputDefaultValue
      : `${inputDefaultValue}`;
    setInputText(stringifiedValue);
  }, [inputDefaultValue]);

  /**
   * Objective - Use value from useController as source of truth for the
   * value of the component.
   *
   * Reason - If an when the value changes from outside the field like during
   * reset or default value change, the component would react accordingly.
   *
   * Problem - The base input components always expects a string value and this
   * is ok for all types expect the number type which has an edge case.
   * If the number typed out is "1.0" and we run Number("1.0") on it, it returns 1
   * and this is what we save in the "value" of useController but in the field component
   * we need to "1.0" as that is what it was typed out.
   *
   * Solution - We have a state called inputText which always stores the textual form of
   * the base input component value. As the main problem are number types we check if
   * the inputText and the actual value are same then the inputText can be used and
   * if for some reason the value is null (due to invalid number) then we check if the
   * null/undefined if set buy the onChange method or the null/undefined came from
   * resetting the field.
   */
  const text = useMemo(() => {
    if (isNil(value)) {
      if (isNilSetByField.current) {
        isNilSetByField.current = false;
        return inputText;
      }

      return value;
    }

    if (!isNil(value)) {
      if (typeof value === "number") {
        if (Number(inputText) === value) {
          return inputText;
        } else {
          return `${value}`;
        }
      }

      return `${value}`;
    }

    return value;
  }, [value, inputText]);

  const isValueValid = isValid(schemaItem, text);

  useRegisterFieldValidity({
    fieldName: name,
    fieldType: schemaItem.fieldType,
    isValid: isValueValid,
  });

  const { inputRef } = useEvents<HTMLInputElement | HTMLTextAreaElement>({
    fieldBlurHandler: onBlur,
    onBlurDynamicString,
    onFocusDynamicString,
  });

  const inputType =
    INPUT_FIELD_TYPE[schemaItem.fieldType as typeof INPUT_TYPES[number]];

  const keyDownHandler = useCallback(
    (
      e:
        | React.KeyboardEvent<HTMLTextAreaElement>
        | React.KeyboardEvent<HTMLInputElement>,
      fieldOnChangeHandler: (...event: any[]) => void,
      isValueValid: boolean,
    ) => {
      const { onEnterKeyPress } = schemaItem;
      const isEnterKey = e.key === "Enter";

      if (isEnterKey && onEnterKeyPress && isValueValid) {
        executeAction({
          triggerPropertyName: "onEnterKeyPress",
          dynamicString: onEnterKeyPress,
          event: {
            type: EventType.ON_ENTER_KEY_PRESS,
            callback: () =>
              onTextChangeHandler("", fieldOnChangeHandler, "onEnterKeyPress"),
          },
        });
      }
    },
    [schemaItem.onEnterKeyPress, isValueValid],
  );

  const onTextChangeHandler = useCallback(
    (
      inputValue: string,
      fieldOnChangeHandler: (...event: any[]) => void,
      triggerPropertyName = "onTextChange",
    ) => {
      const { onTextChanged } = schemaItem;
      // text - what we show in the component
      // value - what we store in the formData
      const { text, value } = transformValue(inputValue, inputText || "");

      if (isNil(value)) {
        isNilSetByField.current = true;
      }

      fieldOnChangeHandler(value);
      setInputText(text);

      if (onTextChanged && executeAction) {
        executeAction({
          triggerPropertyName,
          dynamicString: onTextChanged,
          event: {
            type: EventType.ON_TEXT_CHANGE,
          },
          updateDependencyType: ActionUpdateDependency.FORM_DATA,
        });
      }
    },
    [schemaItem.onTextChanged, transformValue, executeAction, inputText],
  );

  const conditionalProps = useMemo(() => {
    const { errorMessage, isRequired, maxChars } = schemaItem;
    const isInvalid = !isValueValid; // valid property in property pane
    const props = {
      errorMessage,
      isInvalid: false,
      maxChars: undefined as number | undefined,
    };

    if (isDirty && isInvalid) {
      props.isInvalid = true;

      if (isDirty && isRequired && !inputText?.trim()?.length) {
        props.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
      }
    }

    if (inputType === "TEXT" && maxChars) {
      props.maxChars = maxChars;

      if (
        inputDefaultValue &&
        typeof inputDefaultValue === "string" &&
        inputDefaultValue?.toString()?.length > maxChars
      ) {
        props.isInvalid = true;
        props.errorMessage = createMessage(
          INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
          maxChars,
        );
      } else if (
        inputText &&
        typeof inputText === "string" &&
        inputDefaultValue !== inputText &&
        inputText?.toString()?.length > maxChars
      ) {
        props.isInvalid = true;
        props.errorMessage = createMessage(INPUT_TEXT_MAX_CHAR_ERROR, maxChars);
      }
    }

    return props;
  }, [schemaItem, isDirty, isValueValid, inputText]);

  const fieldComponent = useMemo(() => {
    return (
      <BaseInputComponent
        {...conditionalProps}
        accentColor={schemaItem.accentColor}
        borderRadius={schemaItem.borderRadius}
        boxShadow={schemaItem.boxShadow}
        compactMode={false}
        disableNewLineOnPressEnterKey={Boolean(schemaItem.onEnterKeyPress)}
        disabled={schemaItem.isDisabled}
        iconAlign={schemaItem.iconAlign || "left"}
        iconName={schemaItem.iconName}
        inputHTMLType={inputHTMLType}
        inputRef={inputRef}
        inputType={inputType}
        isLoading={false}
        label=""
        leftIcon={leftIcon}
        maxNum={schemaItem.maxNum}
        minNum={schemaItem.minNum}
        multiline={schemaItem.fieldType === FieldType.MULTILINE_TEXT_INPUT}
        onFocusChange={setIsFocused}
        onKeyDown={(e) => keyDownHandler(e, onChange, isValueValid)}
        onValueChange={(value) => onTextChangeHandler(value, onChange)}
        placeholder={schemaItem.placeholderText}
        showError={isFocused}
        spellCheck={schemaItem.isSpellCheck}
        stepSize={1}
        value={text || ""}
        widgetId=""
      />
    );
  }, [
    conditionalProps,
    inputHTMLType,
    inputRef,
    isFocused,
    keyDownHandler,
    leftIcon,
    onTextChangeHandler,
    schemaItem,
    setIsFocused,
    value,
  ]);

  return (
    <Field
      accessor={schemaItem.accessor}
      defaultValue={inputDefaultValue}
      fieldClassName={fieldClassName}
      isRequiredField={schemaItem.isRequired}
      label={schemaItem.label}
      labelStyle={schemaItem.labelStyle}
      labelTextColor={schemaItem.labelTextColor}
      labelTextSize={schemaItem.labelTextSize}
      name={name}
      tooltip={schemaItem.tooltip}
    >
      <StyledInputWrapper
        multiline={schemaItem.fieldType === FieldType.MULTILINE_TEXT_INPUT}
      >
        {fieldComponent}
      </StyledInputWrapper>
    </Field>
  );
}

BaseInputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;
BaseInputField.isValidType = isValidType;

export default BaseInputField;
