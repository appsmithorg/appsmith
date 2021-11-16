import React, { useContext, useEffect, useRef, useState } from "react";
import { Alignment, IconName } from "@blueprintjs/core";
import { pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import FormContext from "../FormContext";
import InputComponent from "widgets/InputWidget/component";
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
  INPUT_FIELD_TYPE,
  INPUT_TYPES,
} from "../constants";
import useEvents from "./useEvents";

type InputComponentProps = FieldComponentBaseProps & {
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
  validation: boolean;
  isSpellCheck: boolean;
};

type InputFieldProps = BaseFieldComponentProps<InputComponentProps>;

const COMPONENT_DEFAULT_VALUES: InputComponentProps = {
  isDisabled: false,
  label: "",
  validation: false,
  isVisible: true,
  isSpellCheck: false,
};

function InputField({ name, propertyPath, schemaItem }: InputFieldProps) {
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
  const { inputRef } = useEvents<HTMLInputElement | HTMLTextAreaElement>();

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
            onTextChangeHandler("", onChangeHandler, "onEnterKeyPress"),
        },
      });
    }
  };

  const onTextChangeHandler = (
    value: any,
    onChangeHandler: (...event: any[]) => void,
    triggerPropertyName = "onTextChange",
  ) => {
    const { onTextChanged } = schemaItem;

    onChangeHandler(value);

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
  // eslint-disable-next-line
  console.log("SCHEMA ITEM", { schemaItem, name });

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
      defaultValue={schemaItem.defaultValue}
      label={schemaItem.label}
      labelStyles={labelStyles}
      name={name}
      render={({
        field: { onBlur, onChange, value },
        fieldState: { isTouched },
      }) => {
        const conditionalProps = (() => {
          const {
            defaultValue,
            errorMessage: errorMsg,
            isRequired,
            maxChars,
            validation,
          } = schemaItem;

          let errorMessage = errorMsg;
          // TODO: Fix this
          let isInvalid = typeof validation === "boolean" && !validation; // valid property in property pane

          if (isRequired && isTouched && !value) {
            isInvalid = true;
            errorMessage = createMessage(FIELD_REQUIRED_ERROR);
          }

          if (
            inputType === "TEXT" &&
            maxChars &&
            defaultValue &&
            defaultValue?.toString()?.length > maxChars
          ) {
            isInvalid = true;
            errorMessage = createMessage(INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR);
          }

          return {
            errorMessage,
            maxChars,
            isInvalid,
          };
        })();

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
            onBlurHandler={onBlur}
            onCurrencyTypeChange={onCurrencyTypeChange}
            onFocusChange={setIsFocused}
            onISDCodeChange={onISDCodeChange}
            onKeyDown={(e) => keyDownHandler(e, onChange)}
            onValueChange={(value) => onTextChangeHandler(value, onChange)}
            phoneNumberCountryCode={selectedPhoneNumberCountryCode}
            placeholder={schemaItem.placeholderText}
            showError={isFocused}
            spellCheck={schemaItem.isSpellCheck}
            stepSize={1}
            value={value}
            widgetId=""
          />
        );
      }}
    />
  );
}

InputField.componentDefaultValues = COMPONENT_DEFAULT_VALUES;

export default InputField;
