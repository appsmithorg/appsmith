import React, { useContext, useState } from "react";
import { IconName, Alignment } from "@blueprintjs/core";
import { pick } from "lodash";

import Field from "widgets/FormBuilderWidget/component/Field";
import FormContext from "../FormContext";
import InputComponent from "widgets/InputWidget/component";
import { BaseFieldComponentProps } from "./types";
import { CONFIG } from "widgets/InputWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { InputValidator } from "widgets/InputWidget/widget";
import { RenderModes, TextSize } from "constants/WidgetConstants";
import {
  createMessage,
  FIELD_REQUIRED_ERROR,
  INPUT_DEFAULT_TEXT_MAX_CHAR_ERROR,
} from "constants/messages";
import { INPUT_FIELD_TYPE, INPUT_TYPES } from "../constants";

const COMPONENT_DEFAULT_VALUES: InputFieldOwnProps = {
  isDisabled: false,
  label: "",
  validation: false,
};

type InputFieldOwnProps = {
  allowCurrencyChange?: boolean;
  autoFocus?: boolean;
  currencyCountryCode?: string;
  decimalsInCurrency?: number;
  defaultText?: string | number;
  errorMessage?: string;
  iconAlign?: Omit<Alignment, "center">;
  iconName?: IconName;
  isAutoFocusEnabled?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  label: string;
  labelStyle?: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  maxChars?: number;
  maxNum?: number;
  minNum?: number;
  noOfDecimals?: number;
  onSubmit?: string;
  onTextChanged?: string;
  phoneNumberCountryCode?: string;
  placeholderText?: string;
  regex?: string;
  tooltip?: string;
  validation: boolean;
};

type InputFieldProps = BaseFieldComponentProps<InputFieldOwnProps>;

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
    const { onSubmit } = schemaItem;
    const isEnterKey = e.key === "Enter";

    if (isEnterKey && onSubmit) {
      executeAction({
        triggerPropertyName: "onSubmit",
        dynamicString: onSubmit,
        event: {
          type: EventType.ON_SUBMIT,
          callback: () => onTextChangeHandler("", onChangeHandler, "onSubmit"),
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
  console.log("SCHEMA ITEM", schemaItem);

  const selectedCurrencyCountryCode =
    metaCurrencyCountryCode || schemaItem.currencyCountryCode;
  const selectedPhoneNumberCountryCode =
    metaPhoneNumberCountryCode || schemaItem.phoneNumberCountryCode;

  const labelStyles = {
    labelStyle: schemaItem.labelStyle,
    labelTextColor: schemaItem.labelTextColor,
    labelTextSize: schemaItem.labelTextSize,
  };

  return (
    <Field
      label={schemaItem.label}
      labelStyles={labelStyles}
      name={name}
      render={({
        field: { onBlur, onChange, value },
        fieldState: { isTouched },
      }) => {
        const conditionalProps = (() => {
          const {
            defaultText,
            errorMessage: errorMsg,
            isRequired,
            maxChars,
            validation,
          } = schemaItem;
          let errorMessage = errorMsg;
          let isInvalid = typeof validation === "boolean" && !validation; // valid property in property pane

          if (isRequired && isTouched && !value) {
            isInvalid = true;
            errorMessage = createMessage(FIELD_REQUIRED_ERROR);
          }

          if (
            inputType === "TEXT" &&
            maxChars &&
            defaultText &&
            defaultText?.toString()?.length > maxChars
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
            // inputRef={ref}
            decimalsInCurrency={schemaItem.decimalsInCurrency}
            disabled={schemaItem.isDisabled}
            iconAlign={schemaItem.iconAlign}
            iconName={schemaItem.iconName}
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
