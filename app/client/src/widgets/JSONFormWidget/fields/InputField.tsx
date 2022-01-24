import React, { useContext, useState } from "react";
import { Alignment, IconName } from "@blueprintjs/core";
import { pick } from "lodash";

import Field from "widgets/JSONFormWidget/component/Field";
import FormContext from "../FormContext";
import InputComponent from "widgets/InputWidget/component";
import useEvents from "./useEvents";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { RenderModes } from "constants/WidgetConstants";
import {
  createMessage,
  FIELD_REQUIRED_ERROR,
  INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
} from "constants/messages";
import {
  BaseFieldComponentProps,
  FieldComponentBaseProps,
  FieldEventProps,
  FieldType,
  INPUT_FIELD_TYPE,
  INPUT_TYPES,
} from "../constants";

type InputComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    allowCurrencyChange?: boolean;
    currencyCountryCode?: string;
    decimalsInCurrency?: number;
    errorMessage?: string;
    iconAlign?: Omit<Alignment, "center">;
    iconName?: IconName;
    maxChars?: number;
    maxNum?: number;
    minNum?: number;
    noOfDecimals?: number;
    onEnterKeyPress?: string;
    onTextChanged?: string;
    phoneNumberCountryCode?: string;
    placeholderText?: string;
    regex?: string;
    validation?: boolean;
    isSpellCheck: boolean;
  };

type InputFieldProps = BaseFieldComponentProps<InputComponentProps>;

type IsValidOptions = {
  fieldType: FieldType;
};

const COMPONENT_DEFAULT_VALUES: InputComponentProps = {
  isDisabled: false,
  isRequired: false,
  isSpellCheck: false,
  isVisible: true,
  label: "",
};

const EMAIL_REGEX = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);

const parseRegex = (regex?: string) => {
  if (regex && typeof regex === "string") {
    /*
     * break up the regexp pattern into 4 parts: given regex, regex prefix , regex pattern, regex flags
     *
     *  Example /test/i will be split into ["/test/gi", "/", "test", "gi"]
     */
    const regexParts = regex.match(/(\/?)(.+)\1([a-z]*)/i);

    if (!regexParts) {
      return new RegExp(regex);
    }

    /*
      * if we don't have a regex flags (gmisuy), convert provided string into regexp directly
      /*
      if (regexParts[3] && !/^(?!.*?(.).*?\\1)[gmisuy]+$/.test(regexParts[3])) {
        parsedRegex = RegExp(this.regex);
      }
      /*
      * if we have a regex flags, use it to form regexp
      */
    return new RegExp(regexParts[2], regexParts[3]);
  }

  return null;
};

const isValid = (schemaItem: InputFieldProps["schemaItem"], value?: string) => {
  const { fieldType, isRequired, regex, validation } = schemaItem;
  // If the validation expression fails return invalid
  if (typeof validation === "boolean" && !validation) {
    return false;
  }

  if (isRequired && !value?.trim?.()) {
    return false;
  }

  const parsedRegex = parseRegex(regex);

  if (
    fieldType === FieldType.EMAIL ||
    fieldType === FieldType.CURRENCY ||
    fieldType === FieldType.PHONE_NUMBER
  ) {
    if (isRequired && !value) return false;
    if (!isRequired && !value) return true;

    if (fieldType === FieldType.EMAIL && value) {
      return EMAIL_REGEX.test(value);
    }

    if (
      fieldType === FieldType.CURRENCY ||
      fieldType === FieldType.PHONE_NUMBER
    ) {
      const cleanValue = value?.split(",")?.join("");
      if (parsedRegex && cleanValue) {
        return parsedRegex.test(cleanValue);
      }
    }
  }

  if (fieldType === FieldType.NUMBER && value) {
    const isValidNumber = Number.isFinite(parseFloat(value));
    if (isRequired && !isValidNumber) return false;
    if (!isRequired && (value === "" || value === undefined)) return true;

    if (parsedRegex && value) {
      return parsedRegex.test(value);
    }

    return isValidNumber;
  }

  if (parsedRegex && value) {
    return parsedRegex.test(value);
  }

  return true;
};

function parseValue(
  schemaItem: InputFieldProps["schemaItem"],
  isValid: boolean,
  value?: string | number,
) {
  if (
    value !== undefined &&
    typeof value === "string" &&
    (schemaItem.fieldType === FieldType.NUMBER ||
      schemaItem.fieldType === FieldType.CURRENCY) &&
    isValid
  ) {
    if (value === "") return undefined;
    return parseFloat(value);
  }

  return value;
}

function isValidType(value: string, options?: IsValidOptions) {
  if (options?.fieldType === FieldType.EMAIL && value) {
    return EMAIL_REGEX.test(value);
  }

  return false;
}

function InputField({
  name,
  propertyPath,
  schemaItem,
  ...rest
}: InputFieldProps) {
  const { executeAction, renderMode, updateWidgetProperty } = useContext(
    FormContext,
  );

  const [metaCurrencyCountryCode, setMetaCurrencyCountryCode] = useState<
    string | undefined
  >();
  const [metaPhoneNumberCountryCode, setMetaPhoneNumberCountryCode] = useState<
    string | undefined
  >();
  const [isFocused, setIsFocused] = useState(false);

  const {
    fieldType,
    isRequired,
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;

  const { onFieldValidityChange } = useRegisterFieldValidity({
    fieldName: name,
    fieldType,
  });

  const { inputRef, registerFieldOnBlurHandler } = useEvents<
    HTMLInputElement | HTMLTextAreaElement
  >({
    onBlurDynamicString,
    onFocusDynamicString,
  });

  const inputType =
    INPUT_FIELD_TYPE[schemaItem.fieldType as typeof INPUT_TYPES[number]];

  const onCurrencyTypeChange = (code?: string) => {
    if (renderMode === RenderModes.CANVAS) {
      updateWidgetProperty?.(`${propertyPath}.currencyCountryCode`, code);
    } else {
      setMetaCurrencyCountryCode(code);
    }
  };

  const onISDCodeChange = (code?: string) => {
    if (renderMode === RenderModes.CANVAS) {
      updateWidgetProperty?.(`${propertyPath}.phoneNumberCountryCode`, code);
    } else {
      setMetaPhoneNumberCountryCode(code);
    }
  };

  const keyDownHandler = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
    onChangeHandler: (...event: any[]) => void,
  ) => {
    // TODO: There is a 'isValid' derived prop in the input widget and there is a check if the input is valid
    // then execute onSubmit
    const { onEnterKeyPress } = schemaItem;
    const isEnterKey = e.key === "Enter";

    if (isEnterKey && onEnterKeyPress) {
      executeAction({
        triggerPropertyName: "onEnterKeyPress",
        dynamicString: onEnterKeyPress,
        event: {
          type: EventType.ON_ENTER_KEY_PRESS,
          callback: () =>
            onTextChangeHandler("", onChangeHandler, true, "onEnterKeyPress"),
        },
      });
    }
  };

  const onTextChangeHandler = (
    value: string,
    onChangeHandler: (...event: any[]) => void,
    isValueValid: boolean,
    triggerPropertyName = "onTextChange",
  ) => {
    const parsedValue = parseValue(schemaItem, isValueValid, value);
    const { onTextChanged } = schemaItem;

    onChangeHandler(parsedValue);

    if (onTextChanged && executeAction) {
      executeAction({
        triggerPropertyName,
        dynamicString: onTextChanged,
        event: {
          type: EventType.ON_TEXT_CHANGE,
        },
      });
    }
  };

  const selectedCurrencyCountryCode =
    metaCurrencyCountryCode || schemaItem.currencyCountryCode;
  const selectedPhoneNumberCountryCode =
    metaPhoneNumberCountryCode || schemaItem.phoneNumberCountryCode;

  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  return (
    <Field
      {...rest}
      defaultValue={schemaItem.defaultValue}
      isRequiredField={isRequired}
      label={schemaItem.label}
      labelStyles={labelStyles}
      name={name}
      render={({
        field: { onBlur, onChange, value },
        fieldState: { isDirty },
      }) => {
        const isValueValid = isValid(schemaItem, value);
        const conditionalProps = (() => {
          const {
            defaultValue,
            errorMessage,
            isRequired,
            maxChars,
          } = schemaItem;

          const isInvalid = !isValueValid; // valid property in property pane
          const props = {
            errorMessage,
            isInvalid: false,
            maxChars: undefined as number | undefined,
          };

          if (isDirty && isInvalid) {
            props.isInvalid = true;

            if (isDirty && isRequired && !value?.trim()?.length) {
              props.errorMessage = createMessage(FIELD_REQUIRED_ERROR);
            }
          }

          if (
            inputType === "TEXT" &&
            maxChars &&
            defaultValue &&
            defaultValue?.toString()?.length > maxChars
          ) {
            props.isInvalid = true;
            props.errorMessage = createMessage(
              INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
            );
            props.maxChars = maxChars;
          }

          return props;
        })();

        registerFieldOnBlurHandler(onBlur);
        onFieldValidityChange(isValueValid);

        return (
          <InputComponent
            {...conditionalProps}
            allowCurrencyChange={schemaItem.allowCurrencyChange}
            compactMode={false}
            currencyCountryCode={selectedCurrencyCountryCode}
            decimalsInCurrency={schemaItem.decimalsInCurrency}
            disabled={schemaItem.isDisabled}
            iconAlign={schemaItem.iconAlign}
            iconName={schemaItem.iconName}
            inputRef={inputRef}
            inputType={inputType}
            isLoading={false}
            label=""
            labelStyle={schemaItem.labelStyle}
            labelTextColor={schemaItem.labelTextColor}
            labelTextSize={schemaItem.labelTextSize}
            maxNum={schemaItem.maxNum}
            minNum={schemaItem.minNum}
            multiline={false}
            onCurrencyTypeChange={onCurrencyTypeChange}
            onFocusChange={setIsFocused}
            onISDCodeChange={onISDCodeChange}
            onKeyDown={(e) => keyDownHandler(e, onChange)}
            onValueChange={(value) =>
              onTextChangeHandler(value, onChange, isValueValid)
            }
            phoneNumberCountryCode={selectedPhoneNumberCountryCode}
            placeholder={schemaItem.placeholderText}
            showError={isFocused}
            spellCheck={schemaItem.isSpellCheck}
            stepSize={1}
            value={value || ""}
            widgetId=""
          />
        );
      }}
      tooltip={schemaItem.tooltip}
    />
  );
}

InputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;
InputField.isValidType = isValidType;

export default InputField;
