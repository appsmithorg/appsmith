import React from "react";
import styled from "styled-components";
import {
  getBorderCSSShorthand,
  IntentColors,
  labelStyle,
} from "constants/DefaultTheme";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import {
  Alignment,
  Intent,
  NumericInput,
  IconName,
  InputGroup,
  Button,
  Label,
  Classes,
  ControlGroup,
  TextArea,
  Tag,
  Position,
} from "@blueprintjs/core";
import Tooltip from "components/ads/Tooltip";
import { ReactComponent as HelpIcon } from "assets/icons/control/help.svg";
import { IconWrapper } from "constants/IconConstants";
import { InputType, InputTypes } from "widgets/InputWidget";
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
  flex-direction: ${(props) => (props.compactMode ? "row" : "column")};
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
          fill: ${(props) => props.theme.colors.icon?.hover};
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
      .bp3-tag {
        background-color: transparent;
        color: #5c7080;
      }
    }
    .${Classes.CONTROL_GROUP} {
      justify-content: flex-start;
    }
    height: 100%;
    align-items: center;
    label {
      ${labelStyle}
      margin-right: 5px;
      text-align: right;
      align-self: flex-start;
    }
  }
`;

const ToolTipIcon = styled(IconWrapper)`
  cursor: help;
  margin-top: 1.5px;
  &&&:hover {
    svg {
      path {
        fill: #716e6e;
      }
    }
  }
`;

const TextLableWrapper = styled.div<{
  compactMode: boolean;
}>`
  ${(props) =>
    props.compactMode ? "&&& {margin-right: 5px;}" : "width: 100%;"}
  display: flex;
  max-height: 20px;
`;

const TextInputWrapper = styled.div`
  width: 100%;
  display: flex;
  flex: 1;
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

const getSelectedItem = (currencyCountryCode?: string): DropdownOption => {
  let selectedCurrency: CurrencyOptionProps | undefined = currencyCountryCode
    ? CurrencyTypeOptions.find((item: CurrencyOptionProps) => {
        return item.code === currencyCountryCode;
      })
    : undefined;
  if (!selectedCurrency) {
    selectedCurrency = {
      code: "US",
      currency: "USD",
      currency_name: "US Dollar",
      label: "United States",
      phone: "1",
      symbol_native: "$",
    };
  }
  return {
    label: `${selectedCurrency.currency} - ${selectedCurrency.currency_name}`,
    searchText: selectedCurrency.label,
    value: selectedCurrency.code,
    id: selectedCurrency.symbol_native,
  };
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
      value: item.code,
      id: item.symbol_native,
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
      const currentIndexOfDecimal = valueAsString.indexOf(".");
      const indexOfDecimal = valueAsString.length - fractionDigits - 1;
      if (
        valueAsString.includes(".") &&
        currentIndexOfDecimal <= indexOfDecimal
      ) {
        let value = valueAsString.split(",").join("");
        if (value) {
          if (currentIndexOfDecimal !== indexOfDecimal) {
            value = value.substr(0, currentIndexOfDecimal + fractionDigits + 1);
          }
          const locale = navigator.languages?.[0] || "en-US";
          const formatter = new Intl.NumberFormat(locale, {
            style: "decimal",
            minimumFractionDigits: fractionDigits,
          });
          const formattedValue = formatter.format(parseFloat(value));
          this.props.onValueChange(formattedValue);
        } else {
          this.props.onValueChange("");
        }
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

  private numericInputComponent = () => {
    const minorStepSize =
      this.props.inputType === InputTypes.CURRENCY
        ? this.props.decimalsInCurrency || 0
        : 0;
    return (
      <NumericInput
        allowNumericCharactersOnly
        className={this.props.isLoading ? "bp3-skeleton" : Classes.FILL}
        disabled={this.props.disabled}
        intent={this.props.intent}
        leftIcon={
          this.props.inputType === "PHONE_NUMBER" ? (
            "phone"
          ) : this.props.inputType === InputTypes.CURRENCY ? (
            <CurrencyTypeDropdown
              allowCurrencyChange={this.props.allowCurrencyChange}
              onCurrencyTypeChange={this.props.onCurrencyTypeChange}
              options={getCurrencyOptions()}
              selected={getSelectedItem(this.props.currencyCountryCode)}
            />
          ) : this.props.iconName && this.props.iconAlign === "left" ? (
            this.props.iconName
          ) : (
            undefined
          )
        }
        max={this.props.maxNum}
        maxLength={this.props.maxChars}
        min={this.props.minNum}
        minorStepSize={
          minorStepSize === 0 ? undefined : Math.pow(10, -1 * minorStepSize)
        }
        onBlur={() => this.setFocusState(false)}
        onFocus={() => this.setFocusState(true)}
        onKeyDown={this.onKeyDown}
        onValueChange={this.onNumberChange}
        placeholder={this.props.placeholder}
        stepSize={minorStepSize === 0 ? this.props.stepSize : undefined}
        type={this.props.inputType === "PHONE_NUMBER" ? "tel" : undefined}
        value={this.props.value}
      />
    );
  };
  private textAreaInputComponent = () => (
    <TextArea
      autoFocus={this.props.autoFocus}
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
        autoFocus={this.props.autoFocus}
        className={this.props.isLoading ? "bp3-skeleton" : ""}
        disabled={this.props.disabled}
        intent={this.props.intent}
        leftIcon={
          this.props.iconName && this.props.iconAlign === "left"
            ? this.props.iconName
            : undefined
        }
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
          ) : this.props.iconName && this.props.iconAlign === "right" ? (
            <Tag icon={this.props.iconName} />
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
    const { label, tooltip } = this.props;
    const showLabelHeader = label || tooltip;

    return (
      <InputComponentWrapper
        allowCurrencyChange={this.props.allowCurrencyChange}
        compactMode={this.props.compactMode}
        fill
        hasError={this.props.isInvalid}
        inputType={this.props.inputType}
        multiline={this.props.multiline.toString()}
        numeric={this.isNumberInputType(this.props.inputType)}
      >
        {showLabelHeader && (
          <TextLableWrapper
            className="t--input-label-wrapper"
            compactMode={this.props.compactMode}
          >
            {this.props.label && (
              <Label
                className={`
                  t--input-widget-label ${
                    this.props.isLoading
                      ? Classes.SKELETON
                      : Classes.TEXT_OVERFLOW_ELLIPSIS
                  }
                `}
              >
                {this.props.label}
              </Label>
            )}
            {this.props.tooltip && (
              <Tooltip
                content={this.props.tooltip || ""}
                hoverOpenDelay={200}
                position={Position.TOP}
              >
                <ToolTipIcon
                  color={Colors.SILVER_CHALICE}
                  height={14}
                  width={14}
                >
                  <HelpIcon className="t--input-widget-tooltip" />
                </ToolTipIcon>
              </Tooltip>
            )}
          </TextLableWrapper>
        )}
        <TextInputWrapper>
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
        </TextInputWrapper>
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
  currencyCountryCode?: string;
  noOfDecimals?: number;
  allowCurrencyChange?: boolean;
  decimalsInCurrency?: number;
  label: string;
  tooltip?: string;
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
  compactMode: boolean;
  isInvalid: boolean;
  autoFocus?: boolean;
  iconName?: IconName;
  iconAlign?: Omit<Alignment, "center">;
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
