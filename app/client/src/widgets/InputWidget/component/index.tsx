import React from "react";
import styled from "styled-components";
import { labelStyle } from "constants/DefaultTheme";
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
} from "@appsmith/constants/messages";
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
import Icon from "components/ads/Icon";
import { limitDecimalValue, getSeparators } from "./utilities";

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
      height: 36px;
      position: absolute;
      display: inline-block;
      left: 0;
      z-index: 16;
      svg {
        path {
          fill: ${(props) => props.theme.colors.icon?.hover};
        }
      }
      &:hover {
        border: 1px solid ${Colors.GREY_5} !important;
      }
    }
    .${Classes.INPUT} {
      min-height: 36px;
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
        props.inputType === InputTypes.PHONE_NUMBER &&
        `padding-left: 85px;
        `};
      box-shadow: none;
      border: 1px solid;
      border-color: ${({ hasError }) =>
        hasError ? `${Colors.DANGER_SOLID} !important;` : `${Colors.GREY_3};`}
      border-radius: 0;
      height: ${(props) => (props.multiline === "true" ? "100%" : "inherit")};
      width: 100%;
      ${(props) =>
        props.numeric &&
        `
        border-top-right-radius: 0px;
        border-bottom-right-radius: 0px;
        ${props.hasError ? "" : "border-right-width: 0px;"}
      `}
      ${(props) =>
        props.inputType === "PASSWORD" &&
        `
        & + .bp3-input-action {
          height: 36px;
          width: 36px;
          cursor: pointer;
          padding: 1px;
          .password-input {
            color: ${Colors.GREY_6};
            justify-content: center;
            height: 100%;
            svg {
              width: 20px;
              height: 20px;
            }
            &:hover {
              background-color: ${Colors.GREY_2};
              color: ${Colors.GREY_10};
            }
          }
        }
      `}
      transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
      &:active {
        border-color: ${({ hasError }) =>
          hasError ? Colors.DANGER_SOLID : Colors.HIT_GRAY};
      }
      &:hover {
        border-left: 1px solid ${Colors.GREY_5};
        border-right: 1px solid ${Colors.GREY_5};
        border-color: ${Colors.GREY_5};
      }
      &:focus {
        border-color: ${({ hasError }) =>
          hasError ? Colors.DANGER_SOLID : Colors.MYSTIC};

        &:focus {
          outline: 0;
          border: 1px solid ${Colors.GREEN_1};
          box-shadow: 0px 0px 0px 2px ${Colors.GREEN_2} !important;
        }
      }
      &:disabled {
        background-color: ${Colors.GREY_1};
        border: 1.2px solid ${Colors.GREY_3};
        & + .bp3-input-action {
          pointer-events: none;
        }
      }
    }
    .${Classes.INPUT}:disabled {
      background: ${Colors.GREY_1};
      color: ${Colors.GREY_7};
    }
    .${Classes.INPUT_GROUP} {
      display: block;
      margin: 0;
      .bp3-tag {
        background-color: transparent;
        color: #5c7080;
      }
      &.${Classes.DISABLED} + .bp3-button-group.bp3-vertical {
        button {
          background: ${Colors.GREY_1};
        }
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
      color: ${(props) =>
        props.disabled ? Colors.GREY_8 : props.labelTextColor || "inherit"};
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
          props.disabled ? Colors.GREY_1 : Colors.WHITE};
        border: 1.2px solid ${Colors.GREY_3};
        color: ${(props) => (props.disabled ? Colors.GREY_7 : Colors.GREY_10)};
        border-right: 0;
      }
      input:not(:first-child) {
        padding-left: 5px;
        border-left: 1px solid transparent;
        z-index: 16;
        line-height: 16px;

        &:hover:not(:focus):not(:disabled) {
          border-left: 1px solid ${Colors.GREY_5};
        }
      }
    }
  }
  &&&& .bp3-button-group.bp3-vertical {
    border: 1.2px solid ${Colors.GREY_3};
    border-left: none;
    button {
      background: ${Colors.WHITE};
      box-shadow: none;
      min-width: 24px;
      width: 24px;
      border-radius: 0;
      &:hover {
        background: ${Colors.GREY_2};
        span {
          color: ${Colors.GREY_10};
        }
      }
      &:focus {
        border: 1px solid ${Colors.GREEN_1};
        box-shadow: 0px 0px 0px 2px ${Colors.GREEN_2};
      }
      span {
        color: ${Colors.GREY_6};
        svg {
          width: 14px;
        }
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
  groupSeparator: string;
  decimalSeparator: string;
  constructor(props: InputComponentProps) {
    super(props);
    this.state = { showPassword: false };
    const separators = getSeparators();
    this.groupSeparator = separators.groupSeparator;
    this.decimalSeparator = separators.decimalSeparator;
  }

  componentDidMount() {
    if (this.props.inputType === InputTypes.CURRENCY) {
      const element: any = document.querySelectorAll(
        `.appsmith_widget_${this.props.widgetId} .bp3-button`,
      );
      if (element !== null) {
        element[0].addEventListener("click", this.onIncrementButtonClick);
        element[1].addEventListener("click", this.onDecrementButtonClick);
      }
    }
  }

  componentDidUpdate(prevProps: InputComponentProps) {
    if (
      this.props.inputType === InputTypes.CURRENCY &&
      this.props.inputType !== prevProps.inputType
    ) {
      const element: any = document.querySelectorAll(
        `.appsmith_widget_${this.props.widgetId} .bp3-button`,
      );
      if (element !== null) {
        element[0].addEventListener("click", this.onIncrementButtonClick);
        element[1].addEventListener("click", this.onDecrementButtonClick);
      }
    }
  }

  componentWillUnmount() {
    if (this.props.inputType === InputTypes.CURRENCY) {
      const element: any = document.querySelectorAll(
        `.appsmith_widget_${this.props.widgetId} .bp3-button`,
      );
      if (element !== null) {
        element[0].removeEventListener("click", this.onIncrementButtonClick);
        element[1].removeEventListener("click", this.onDecrementButtonClick);
      }
    }
  }

  updateValueOnButtonClick = (type: number) => {
    const deFormattedValue: string | number = this.props.value
      .split(this.groupSeparator)
      .join("");
    const stepSize = this.props.stepSize || 1;
    this.props.onValueChange(
      String(Number(deFormattedValue) + stepSize * type),
    );
  };

  onIncrementButtonClick = (e: React.MouseEvent) => {
    this.updateValueOnButtonClick(1);
    e.preventDefault();
  };

  onDecrementButtonClick = (e: React.MouseEvent) => {
    this.updateValueOnButtonClick(-1);
    e.preventDefault();
  };

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

  onNumberChange = (
    valueAsNum: number,
    valueAsString: string,
    inputElement: HTMLInputElement,
  ) => {
    if (this.props.inputType === InputTypes.CURRENCY) {
      //handle this only when input is focussed
      if (inputElement.className.includes("focus-visible")) {
        const fractionDigits = this.props.decimalsInCurrency || 0;
        const currentIndexOfDecimal = valueAsString.indexOf(
          this.decimalSeparator,
        );
        const indexOfDecimal = valueAsString.length - fractionDigits - 1;
        if (
          valueAsString.includes(this.decimalSeparator) &&
          currentIndexOfDecimal <= indexOfDecimal
        ) {
          const value = limitDecimalValue(
            this.props.decimalsInCurrency,
            valueAsString,
            this.decimalSeparator,
            this.groupSeparator,
          );
          this.props.onValueChange(value);
        } else {
          this.props.onValueChange(valueAsString);
        }
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

  onNumberInputBlur = () => {
    this.setFocusState(false);
  };

  onNumberInputFocus = () => {
    this.setFocusState(true);
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
        autoFocus={this.props.autoFocus}
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
        onBlur={this.onNumberInputBlur}
        onFocus={this.onNumberInputFocus}
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
            <Icon
              className="password-input"
              name={this.state.showPassword ? "eye-off" : "eye-on"}
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
        spellCheck={this.props.spellCheck}
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
  spellCheck: boolean;
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
