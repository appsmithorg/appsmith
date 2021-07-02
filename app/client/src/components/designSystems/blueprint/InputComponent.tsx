import React from "react";
import styled from "styled-components";
import {
  getBorderCSSShorthand,
  IntentColors,
  labelStyle,
} from "constants/DefaultTheme";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import {
  Intent,
  NumericInput,
  IconName,
  InputGroup,
  Button,
  Label,
  Classes,
  ControlGroup,
  TextArea,
} from "@blueprintjs/core";
import { InputType, InputTypes } from "widgets/InputWidget";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { Colors } from "constants/Colors";
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import _ from "lodash";
import {
  createMessage,
  INPUT_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "constants/messages";
import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { CurrencyTypeOptions, CurrencyOptionProps } from "constants/Currency";
import Icon, { IconSize } from "components/ads/Icon";
/**
 * All design system component specific logic goes here.
 * Ex. Blueprint has a separate numeric input and text input so switching between them goes here
 * Ex. To set the icon as currency, blue print takes in a set of defined types
 * All generic logic like max characters for phone numbers should be 10, should go in the widget
 */

const InputComponentWrapper = styled((props) => (
  <ControlGroup {..._.omit(props, ["hasError", "numeric"])} />
))<{
  numeric: boolean;
  multiline: string;
  hasError: boolean;
  allowCurrencyChange?: boolean;
  inputType: InputType;
}>`
  &&&& {
    .currency-type-filter {
      width: 40px;
      height: 32px;
      position: absolute;
      display: inline-block;
      left: 0;
      z-index: 16;
      svg {
        path {
          fill: ${(props) => props.theme.colors.icon.hover};
        }
      }
    }
    .${Classes.INPUT} {
      ${(props) =>
        props.inputType === InputTypes.CURRENCY &&
        props.allowCurrencyChange &&
        `
      padding-left: 45px;`};
      ${(props) =>
        props.inputType === InputTypes.CURRENCY &&
        !props.allowCurrencyChange &&
        `
      padding-left: 35px;`};
      box-shadow: none;
      border: 1px solid;
      border-color: ${({ hasError }) =>
        hasError ? IntentColors.danger : Colors.GEYSER_LIGHT};
      border-radius: 0;
      height: ${(props) => (props.multiline === "true" ? "100%" : "inherit")};
      width: 100%;
      ${(props) =>
        props.numeric &&
        `
        border-top-right-radius: 0px;
        border-bottom-right-radius: 0px;
        border-right-width: 0px;
      `}
      transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
      &:active {
        border-color: ${({ hasError }) =>
          hasError ? IntentColors.danger : Colors.HIT_GRAY};
      }
      &:focus {
        border-color: ${({ hasError }) =>
          hasError ? IntentColors.danger : Colors.MYSTIC};

        &:focus {
          border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
          border-color: #80bdff;
          outline: 0;
          box-shadow: 0 0 0 0.1rem rgba(0, 123, 255, 0.25);
        }
      }
    }
    .${Classes.INPUT_GROUP} {
      display: block;
      margin: 0;
    }
    .${Classes.CONTROL_GROUP} {
      justify-content: flex-start;
    }
    height: 100%;
    align-items: center;
    label {
      ${labelStyle}
      flex: 0 1 30%;
      margin: 7px ${WIDGET_PADDING * 2}px 0 0;
      text-align: right;
      align-self: flex-start;
      max-width: calc(30% - ${WIDGET_PADDING}px);
    }
  }
`;

const DropdownTriggerIconWrapper = styled.div`
  height: 19px;
  padding: 9px 5px 9px 12px;
  width: 40px;
  height: 19px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 19px;
  letter-spacing: -0.24px;
  color: #090707;
`;

const CurrencyIconWrapper = styled.span`
  height: 100%;
  padding: 6px 4px 6px 12px;
  width: 28px;
  position: absolute;
  left: 0;
  z-index: 16;
  font-size: 14px;
  line-height: 19px;
  letter-spacing: -0.24px;
  color: #090707;
`;

interface CurrencyDropdownProps {
  onCurrencyTypeChange: (code?: string) => void;
  options: Array<DropdownOption>;
  selected: DropdownOption;
  allowCurrencyChange?: boolean;
}

function CurrencyTypeDropdown(props: CurrencyDropdownProps) {
  if (!props.allowCurrencyChange) {
    return (
      <CurrencyIconWrapper>
        {getSelectedItem(props.selected.value).id}
      </CurrencyIconWrapper>
    );
  }
  const dropdownTriggerIcon = (
    <DropdownTriggerIconWrapper className="t--input-currency-change">
      {getSelectedItem(props.selected.value).id}
      <Icon name="downArrow" size={IconSize.XXS} />
    </DropdownTriggerIconWrapper>
  );
  return (
    <Dropdown
      containerClassName="currency-type-filter"
      dropdownHeight="195px"
      dropdownTriggerIcon={dropdownTriggerIcon}
      enableSearch
      onSelect={props.onCurrencyTypeChange}
      optionWidth="260px"
      options={props.options}
      searchPlaceholder="Search by currency or country"
      selected={props.selected}
      showLabelOnly
    />
  );
}

const getSelectedItem = (currencyType?: string): DropdownOption => {
  const selectedCurrency: CurrencyOptionProps | undefined = currencyType
    ? CurrencyTypeOptions.find((item: CurrencyOptionProps) => {
        return item.currency === currencyType;
      })
    : undefined;
  if (selectedCurrency) {
    return {
      label: `${selectedCurrency.currency} - ${selectedCurrency.currency_name}`,
      searchText: selectedCurrency.label,
      value: selectedCurrency.currency,
      id: selectedCurrency.symbol_native,
    };
  }
  return CurrencyTypeOptions[0];
};

const countryToFlag = (isoCode: string) => {
  return typeof String.fromCodePoint !== "undefined"
    ? isoCode
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397),
        )
    : isoCode;
};

export const getCurrencyOptions = (): Array<DropdownOption> => {
  return CurrencyTypeOptions.map((item: CurrencyOptionProps) => {
    return {
      leftElement: countryToFlag(item.code),
      searchText: item.label,
      label: `${item.currency} - ${item.currency_name}`,
      value: item.currency,
    };
  });
};

class InputComponent extends React.Component<
  InputComponentProps,
  InputComponentState
> {
  constructor(props: InputComponentProps) {
    super(props);
    this.state = { showPassword: false };
  }

  setFocusState = (isFocused: boolean) => {
    this.props.onFocusChange(isFocused);
  };

  onTextChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    this.props.onValueChange(event.target.value);
  };

  onNumberChange = (valueAsNum: number, valueAsString: string) => {
    if (this.props.inputType === InputTypes.CURRENCY) {
      const fractionDigits = this.props.decimalsInCurrency || 0;
      const locale = navigator.languages?.[0] || "en-US";
      if (!valueAsString.endsWith(".")) {
        const value = parseFloat(valueAsString.split(",").join(""));
        const formatter = new Intl.NumberFormat(locale, {
          style: "decimal",
          maximumFractionDigits: fractionDigits,
        });
        const formattedValue = formatter.format(value);
        this.props.onValueChange(formattedValue);
      } else {
        this.props.onValueChange(valueAsString);
      }
    } else {
      this.props.onValueChange(valueAsString);
    }
  };

  isNumberInputType(inputType: InputType) {
    return (
      inputType === "INTEGER" ||
      inputType === "NUMBER" ||
      inputType === "CURRENCY"
    );
  }

  getIcon(inputType: InputType) {
    switch (inputType) {
      case "PHONE_NUMBER":
        return "phone";
      case "SEARCH":
        return "search";
      case "EMAIL":
        return "envelope";
      default:
        return undefined;
    }
  }

  getType(inputType: InputType) {
    switch (inputType) {
      case "PASSWORD":
        return this.state.showPassword ? "text" : "password";
      case "EMAIL":
        return "email";
      case "SEARCH":
        return "search";
      default:
        return "text";
    }
  }
  onKeyDownTextArea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isEnterKey = e.key === "Enter" || e.keyCode === 13;
    const { disableNewLineOnPressEnterKey } = this.props;
    if (isEnterKey && disableNewLineOnPressEnterKey && !e.shiftKey) {
      e.preventDefault();
    }
    if (typeof this.props.onKeyDown === "function") {
      this.props.onKeyDown(e);
    }
  };
  onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof this.props.onKeyDown === "function") {
      this.props.onKeyDown(e);
    }
  };

  private numericInputComponent = () => (
    <NumericInput
      allowNumericCharactersOnly
      className={this.props.isLoading ? "bp3-skeleton" : Classes.FILL}
      disabled={this.props.disabled}
      intent={this.props.intent}
      leftIcon={
        this.props.inputType === "PHONE_NUMBER"
          ? "phone"
          : this.props.inputType !== InputTypes.CURRENCY
          ? this.props.leftIcon
          : this.props.inputType === InputTypes.CURRENCY && (
              <CurrencyTypeDropdown
                allowCurrencyChange={this.props.allowCurrencyChange}
                onCurrencyTypeChange={this.props.onCurrencyTypeChange}
                options={getCurrencyOptions()}
                selected={getSelectedItem(this.props.currencyType)}
              />
            )
      }
      max={this.props.maxNum}
      maxLength={this.props.maxChars}
      min={this.props.minNum}
      onBlur={() => this.setFocusState(false)}
      onFocus={() => this.setFocusState(true)}
      onKeyDown={this.onKeyDown}
      onValueChange={this.onNumberChange}
      placeholder={this.props.placeholder}
      stepSize={this.props.stepSize}
      type={this.props.inputType === "PHONE_NUMBER" ? "tel" : undefined}
      value={this.props.value}
    />
  );
  private textAreaInputComponent = () => (
    <TextArea
      className={this.props.isLoading ? "bp3-skeleton" : ""}
      disabled={this.props.disabled}
      growVertically={false}
      intent={this.props.intent}
      maxLength={this.props.maxChars}
      onBlur={() => this.setFocusState(false)}
      onChange={this.onTextChange}
      onFocus={() => this.setFocusState(true)}
      onKeyDown={this.onKeyDownTextArea}
      placeholder={this.props.placeholder}
      style={{ resize: "none" }}
      value={this.props.value}
    />
  );

  private textInputComponent = (isTextArea: boolean) =>
    isTextArea ? (
      this.textAreaInputComponent()
    ) : (
      <InputGroup
        className={this.props.isLoading ? "bp3-skeleton" : ""}
        disabled={this.props.disabled}
        intent={this.props.intent}
        maxLength={this.props.maxChars}
        onBlur={() => this.setFocusState(false)}
        onChange={this.onTextChange}
        onFocus={() => this.setFocusState(true)}
        onKeyDown={this.onKeyDown}
        placeholder={this.props.placeholder}
        rightElement={
          this.props.inputType === "PASSWORD" ? (
            <Button
              icon={"lock"}
              onClick={() => {
                this.setState({ showPassword: !this.state.showPassword });
              }}
            />
          ) : (
            undefined
          )
        }
        type={this.getType(this.props.inputType)}
        value={this.props.value}
      />
    );
  private renderInputComponent = (inputType: InputType, isTextArea: boolean) =>
    this.isNumberInputType(inputType)
      ? this.numericInputComponent()
      : this.textInputComponent(isTextArea);

  render() {
    return (
      <InputComponentWrapper
        allowCurrencyChange={this.props.allowCurrencyChange}
        fill
        hasError={this.props.isInvalid}
        inputType={this.props.inputType}
        multiline={this.props.multiline.toString()}
        numeric={this.isNumberInputType(this.props.inputType)}
      >
        {this.props.label && (
          <Label
            className={
              this.props.isLoading
                ? Classes.SKELETON
                : Classes.TEXT_OVERFLOW_ELLIPSIS
            }
          >
            {this.props.label}
          </Label>
        )}
        <ErrorTooltip
          isOpen={this.props.isInvalid && this.props.showError}
          message={
            this.props.errorMessage ||
            createMessage(INPUT_WIDGET_DEFAULT_VALIDATION_ERROR)
          }
        >
          {this.renderInputComponent(
            this.props.inputType,
            this.props.multiline,
          )}
        </ErrorTooltip>
      </InputComponentWrapper>
    );
  }
}

export interface InputComponentState {
  showPassword?: boolean;
}

export interface InputComponentProps extends ComponentProps {
  value: string;
  inputType: InputType;
  disabled?: boolean;
  intent?: Intent;
  defaultValue?: string;
  currencyType?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimalsInCurrency?: number;
  label: string;
  leftIcon?: IconName;
  allowNumericCharactersOnly?: boolean;
  fill?: boolean;
  errorMessage?: string;
  maxChars?: number;
  maxNum?: number;
  minNum?: number;
  onValueChange: (valueAsString: string) => void;
  onCurrencyTypeChange: (code?: string) => void;
  stepSize?: number;
  placeholder?: string;
  isLoading: boolean;
  multiline: boolean;
  isInvalid: boolean;
  showError: boolean;
  onFocusChange: (state: boolean) => void;
  disableNewLineOnPressEnterKey?: boolean;
  onKeyDown?: (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => void;
}

export default InputComponent;
