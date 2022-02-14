import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alignment, IconName } from "@blueprintjs/core";
import { useController } from "react-hook-form";

import Field from "../component/Field";
import FormContext from "../FormContext";
import useEvents from "./useEvents";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  createMessage,
  FIELD_REQUIRED_ERROR,
  INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
} from "@appsmith/constants/messages";
import {
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

export type BaseInputComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    errorMessage?: string;
    iconAlign?: Omit<Alignment, "center">;
    iconName?: IconName;
    maxChars?: number;
    maxNum?: number;
    minNum?: number;
    onEnterKeyPress?: string;
    onTextChanged?: string;
    placeholderText?: string;
    regex?: string;
    validation?: boolean;
    isSpellCheck: boolean;
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
  isValid: (schemaItem: TSchemaItem, value: string) => boolean;
};

type IsValidOptions = {
  fieldType: FieldType;
};

const COMPONENT_DEFAULT_VALUES: BaseInputComponentProps = {
  isDisabled: false,
  isRequired: false,
  isSpellCheck: false,
  isVisible: true,
  label: "",
};

const EMAIL_REGEX = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);

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
  const { executeAction } = useContext(FormContext);
  const inputDefaultValue = schemaItem.defaultValue || passedDefaultValue;

  const [isFocused, setIsFocused] = useState(false);
  const [textValue, setTextValue] = useState<string | undefined | null>("");

  const {
    field: { onBlur, onChange, value },
    fieldState: { isDirty },
  } = useController({
    name,
    shouldUnregister: true,
  });

  const {
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;

  const isValueValid = isValid(schemaItem, value);

  useRegisterFieldValidity({
    fieldName: name,
    fieldType: schemaItem.fieldType,
    isValid: isValueValid,
  });

  useEffect(() => {
    const stringifiedValue: string = value?.toString();

    if (stringifiedValue !== textValue) {
      setTextValue(stringifiedValue);
    }
  }, [value]);

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
      const { text, value } = transformValue(inputValue, textValue || "");

      fieldOnChangeHandler(value);
      setTextValue(text);

      if (onTextChanged && executeAction) {
        executeAction({
          triggerPropertyName,
          dynamicString: onTextChanged,
          event: {
            type: EventType.ON_TEXT_CHANGE,
          },
        });
      }
    },
    [schemaItem.onTextChanged, transformValue, executeAction, textValue],
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

      if (isDirty && isRequired && !textValue?.trim()?.length) {
        props.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
      }
    }

    if (
      inputType === "TEXT" &&
      maxChars &&
      inputDefaultValue &&
      typeof inputDefaultValue === "string" &&
      inputDefaultValue?.toString()?.length > maxChars
    ) {
      props.isInvalid = true;
      props.errorMessage = createMessage(INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR);
      props.maxChars = maxChars;
    }

    return props;
  }, [schemaItem, isDirty, isValueValid, textValue]);

  const fieldComponent = useMemo(() => {
    return (
      <BaseInputComponent
        {...conditionalProps}
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
        value={textValue || ""}
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
      {fieldComponent}
    </Field>
  );
}

BaseInputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;
BaseInputField.isValidType = isValidType;

export default BaseInputField;
