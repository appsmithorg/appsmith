import React from "react";
import styled from "styled-components";
import {
  getBorderCSSShorthand,
  IntentColors,
  labelStyle,
} from "constants/DefaultTheme";
import { ComponentProps } from "widgets/BaseComponent";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
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

import { Colors } from "constants/Colors";
import _ from "lodash";
import {
  createMessage,
  INPUT_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "constants/messages";
import { InputType, InputTypes } from "../constants";

import CurrencyTypeDropdown, {
  CurrencyDropdownOptions,
  getSelectedCurrency,
} from "./CurrencyCodeDropdown";
import ISDCodeDropdown, {
  ISDCodeDropdownOptions,
  getSelectedISDCode,
} from "./ISDCodeDropdown";

// TODO(abhinav): All of the following imports should not be in widgets.
import ErrorTooltip from "components/editorComponents/ErrorTooltip";

/**
 * All design system component specific logic goes here.
 * Ex. Blueprint has a separate numeric input and text input so switching between them goes here
 * Ex. To set the icon as currency, blue print takes in a set of defined types
 * All generic logic like max characters for phone numbers should be 10, should go in the widget
 */

const InputComponentWrapper = styled((props) => (
  <ControlGroup
    {..._.omit(props, [
      "hasError",
      "numeric",
      "labelTextColor",
      "allowCurrencyChange",
      "compactMode",
      "labelStyle",
      "labelTextSize",
      "multiline",
      "numeric",
      "inputType",
    ])}
  />
))<{
  numeric: boolean;
  multiline: string;
  hasError: boolean;
  allowCurrencyChange?: boolean;
  disabled?: boolean;
  inputType: InputType;
}>`
  flex-direction: ${(props) => (props.compactMode ? "row" : "column")};
  &&&& {
    .currency-type-filter,
    .country-type-filter {
      width: fit-content;
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
      ${(props) =>
        props.inputType === InputTypes.PHONE_NUMBER && `padding-left: 85px;`};
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
      color: ${(props) => props.labelTextColor || "inherit"};
      font-size: ${(props) => props.labelTextSize};
      font-weight: ${(props) =>
        props?.labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
      font-style: ${(props) =>
        props?.labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
      text-decoration: ${(props) =>
        props?.labelStyle?.includes(FontStyleTypes.UNDERLINE)
          ? "underline"
          : ""};
    }
  }
`;

const StyledNumericInput = styled(NumericInput)`
  &&&& .bp3-input-group {
    display: flex;
    > {
      &:first-child:not(input) {
        position: static;
        background: ${(props) =>
          props.disabled ? Colors.INPUT_DISABLED : "#fff"};
        color: ${(props) =>
          props.disabled ? Colors.INPUT_TEXT_DISABLED : "#000"};
        border: 1px solid #e7e7e7;
        border-right: 0;
      }
      input:not(:first-child) {
        padding-left: 5px;
        border-left: 0;
        z-index: 16;
        line-height: 16px;
      }
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

export const isNumberInputType = (inputType: InputType) => {
  return (
    inputType === "INTEGER" ||
    inputType === "NUMBER" ||
    inputType === "CURRENCY" ||
    inputType === "PHONE_NUMBER"
  );
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
          const locale = navigator.languages?.[0] || "en-US";
          const formatter = new Intl.NumberFormat(locale, {
            style: "decimal",
            minimumFractionDigits: fractionDigits,
          });
          const decimalValueArray = value.split(".");
          //remove extra digits after decimal point
          if (
            this.props.decimalsInCurrency &&
            decimalValueArray[1].length > this.props.decimalsInCurrency
          ) {
            value =
              decimalValueArray[0] +
              "." +
              decimalValueArray[1].substr(0, this.props.decimalsInCurrency);
          }
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

  getLeftIcon = (inputType: InputType, disabled: boolean) => {
    if (inputType === InputTypes.PHONE_NUMBER) {
      const selectedISDCode = getSelectedISDCode(
        this.props.phoneNumberCountryCode,
      );
      return (
        <ISDCodeDropdown
          disabled={disabled}
          onISDCodeChange={this.props.onISDCodeChange}
          options={ISDCodeDropdownOptions}
          selected={selectedISDCode}
        />
      );
    } else if (inputType === InputTypes.CURRENCY) {
      const selectedCurrencyCountryCode = getSelectedCurrency(
        this.props.currencyCountryCode,
      );
      return (
        <CurrencyTypeDropdown
          allowCurrencyChange={this.props.allowCurrencyChange && !disabled}
          onCurrencyTypeChange={this.props.onCurrencyTypeChange}
          options={CurrencyDropdownOptions}
          selected={selectedCurrencyCountryCode}
        />
      );
    } else if (this.props.iconName && this.props.iconAlign === "left") {
      return this.props.iconName;
    }
    return this.props.leftIcon;
  };

  getIcon(inputType: InputType) {
    switch (inputType) {
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
    const leftIcon = this.getLeftIcon(
      this.props.inputType,
      !!this.props.disabled,
    );
    const minorStepSize =
      this.props.inputType === InputTypes.CURRENCY
        ? this.props.decimalsInCurrency || 0
        : 0;
    return (
      <StyledNumericInput
        allowNumericCharactersOnly
        className={this.props.isLoading ? "bp3-skeleton" : Classes.FILL}
        disabled={this.props.disabled}
        intent={this.props.intent}
        leftIcon={leftIcon}
        max={this.props.maxNum}
        maxLength={this.props.maxChars}
        min={
          this.props.inputType === InputTypes.PHONE_NUMBER
            ? 0
            : this.props.minNum
        }
        minorStepSize={
          minorStepSize === 0 ? undefined : Math.pow(10, -1 * minorStepSize)
        }
        onBlur={() => this.setFocusState(false)}
        onFocus={() => this.setFocusState(true)}
        onKeyDown={this.onKeyDown}
        onValueChange={this.onNumberChange}
        placeholder={this.props.placeholder}
        stepSize={minorStepSize === 0 ? this.props.stepSize : undefined}
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
    isNumberInputType(inputType)
      ? this.numericInputComponent()
      : this.textInputComponent(isTextArea);

  render() {
    const {
      label,
      labelStyle,
      labelTextColor,
      labelTextSize,
      tooltip,
    } = this.props;
    const showLabelHeader = label || tooltip;

    return (
      <InputComponentWrapper
        allowCurrencyChange={this.props.allowCurrencyChange}
        compactMode={this.props.compactMode}
        disabled={this.props.disabled}
        fill
        hasError={this.props.isInvalid}
        inputType={this.props.inputType}
        labelStyle={labelStyle}
        labelTextColor={labelTextColor}
        labelTextSize={labelTextSize ? TEXT_SIZES[labelTextSize] : "inherit"}
        multiline={this.props.multiline.toString()}
        numeric={isNumberInputType(this.props.inputType)}
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
                content={this.props.tooltip}
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
  defaultValue?: string | number;
  currencyCountryCode?: string;
  noOfDecimals?: number;
  phoneNumberCountryCode?: string;
  allowCurrencyChange?: boolean;
  decimalsInCurrency?: number;
  label: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
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
  onISDCodeChange: (code?: string) => void;
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
