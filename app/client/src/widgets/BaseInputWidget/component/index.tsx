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
import _, { isNil } from "lodash";
import {
  createMessage,
  INPUT_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "@appsmith/constants/messages";
import { InputTypes } from "../constants";

// TODO(abhinav): All of the following imports should not be in widgets.
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import Icon from "components/ads/Icon";
import { InputType } from "widgets/InputWidget/constants";
import { lightenColor } from "widgets/WidgetUtils";

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
      "borderRadius",
      "boxShadow",
      "primaryColor",
    ])}
  />
))<{
  numeric: boolean;
  multiline: string;
  hasError: boolean;
  allowCurrencyChange?: boolean;
  disabled?: boolean;
  inputType: InputType;
  borderRadius?: string;
  boxShadow?: string;
  primaryColor?: string;
}>`
  flex-direction: ${(props) => (props.compactMode ? "row" : "column")};
  height: 100%;
  align-items: center;
  justify-content: flex-end;
  gap: ${(props) => (props.compactMode ? "10px" : "5px")};

  .currency-type-filter,
  .country-type-filter {
    width: fit-content;
    height: 100%;
    position: static;
    display: inline-block;
    left: 0;
    z-index: 16;
    svg {
      path {
        fill: ${(props) => props.theme.colors.icon?.hover};
      }
    }
  }

  &&&& .bp3-input-group {
    display: flex;
    > {
      &:first-child:not(input) {
        position: static;
        background: ${(props) =>
          props.disabled ? Colors.GREY_1 : Colors.WHITE};
        color: ${(props) => (props.disabled ? Colors.GREY_7 : Colors.GREY_10)};
        border-right: 0;
      }
      input:not(:first-child) {
        padding-left: 0px;
        z-index: 16;
        line-height: 16px;
      }
    }
  }

  .currency-type-filter .bp3-popover-open > div,
  .country-type-filter .bp3-popover-open > div {
    border: 0px solid !important;
    box-shadow: none !important;
    background-color: #fafafa;
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
      props.inputType === InputTypes.PHONE_NUMBER &&
      `padding-left: 85px;
    `};
    background: ${({ disabled }) => (disabled ? Colors.GREY_1 : Colors.WHITE)};
    border-radius: 0px;
    box-shadow: none !important;
    height: 100%;
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
      height: 100%;
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
  }

  & {
    .${Classes.INPUT_GROUP} {
      display: flex;
      margin: 0;
      .bp3-tag {
        background-color: transparent;
        color: #5c7080;
      }

      .${Classes.INPUT_ACTION} {
        height: 100%;

        .${Classes.TAG} {
          height: 100%;
          padding: 0;
          margin: 0;
          display: flex;
          align-items: center;
        }
      }

      .${Classes.ICON} {
        height: 100%;
        margin: 0;
        display: flex;
        align-items: center;
        margin: 0 10px;

        svg {
          width: 14px;
          height: 14px;
        }
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

    label {
      ${labelStyle}
      margin-right: 0px;
      margin-bottom: 0px;
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
        color: ${(props) => (props.disabled ? Colors.GREY_7 : Colors.GREY_10)};
        border-right: 0;
      }
      input:not(:first-child) {
        padding-left: 0px;
        z-index: 16;
        line-height: 16px;
      }
    }
  }
  &&&& .bp3-button-group.bp3-vertical {
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

const TextInputWrapper = styled.div<{
  borderRadius?: string;
  boxShadow?: string;
  primaryColor?: string;
  hasError?: boolean;
  disabled?: boolean;
}>`
  width: 100%;
  display: flex;
  flex: 1;
  height: 100%;
  border: 1px solid;
  overflow: hidden;
  border-color: ${({ hasError }) =>
    hasError ? `${Colors.DANGER_SOLID} !important;` : `${Colors.GREY_3};`}
  border-radius: ${({ borderRadius }) => borderRadius} !important;
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
  min-height: 32px;

  &:focus-within {
    outline: 0;
    border-color: ${({ hasError, primaryColor }) =>
      hasError ? Colors.DANGER_SOLID : primaryColor};
    box-shadow: ${({ hasError, primaryColor }) =>
      `0px 0px 0px 3px ${lightenColor(
        hasError ? Colors.DANGER_SOLID : primaryColor,
      )} !important;`};
  }

  ${({ disabled }) =>
    disabled &&
    ` background-color: ${Colors.GREY_1};
      border: 1px solid ${Colors.GREY_3};
      & + .bp3-input-action {
      pointer-events: none;
  }`}
`;

type InputHTMLType = "TEXT" | "NUMBER" | "PASSWORD" | "EMAIL" | "TEL";

export const isNumberInputType = (inputHTMLType: InputHTMLType = "TEXT") => {
  return inputHTMLType === "NUMBER";
};

class BaseInputComponent extends React.Component<
  BaseInputComponentProps,
  InputComponentState
> {
  constructor(props: BaseInputComponentProps) {
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
    this.props.onValueChange(valueAsString);
  };

  getLeftIcon = () => {
    if (this.props.iconName && this.props.iconAlign === "left") {
      return this.props.iconName;
    }
    return this.props.leftIcon;
  };

  getType(inputType: InputHTMLType = "TEXT") {
    switch (inputType) {
      case "PASSWORD":
        return this.state.showPassword ? "text" : "password";
      case "TEL":
        return "tel";
      case "EMAIL":
        return "email";
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
    const leftIcon = this.getLeftIcon();
    const conditionalProps: Record<string, number> = {};

    if (!isNil(this.props.maxNum)) {
      conditionalProps.max = this.props.maxNum;
    }

    if (!isNil(this.props.minNum)) {
      conditionalProps.min = this.props.minNum;
    }

    return (
      <StyledNumericInput
        allowNumericCharactersOnly
        autoFocus={this.props.autoFocus}
        className={this.props.isLoading ? "bp3-skeleton" : Classes.FILL}
        disabled={this.props.disabled}
        intent={this.props.intent}
        leftIcon={leftIcon}
        majorStepSize={null}
        minorStepSize={null}
        onBlur={() => this.setFocusState(false)}
        onFocus={() => this.setFocusState(true)}
        onKeyDown={this.onKeyDown}
        onValueChange={this.onNumberChange}
        placeholder={this.props.placeholder}
        stepSize={this.props.stepSize}
        value={this.props.value}
        {...conditionalProps}
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
            : this.props.leftIcon
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
        type={this.getType(this.props.inputHTMLType)}
        value={this.props.value}
      />
    );
  private renderInputComponent = (
    inputHTMLType: InputHTMLType = "TEXT",
    isTextArea: boolean,
  ) =>
    isNumberInputType(inputHTMLType)
      ? this.numericInputComponent()
      : this.textInputComponent(isTextArea);

  onStepIncrement = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onStep && this.props.onStep(1);
  };

  onStepDecrement = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onStep && this.props.onStep(-1);
  };

  componentDidMount() {
    if (isNumberInputType(this.props.inputHTMLType) && this.props.onStep) {
      const element: any = document.querySelector(
        `.appsmith_widget_${this.props.widgetId} .bp3-button-group`,
      );

      if (element !== null && element.childNodes) {
        element.childNodes[0].addEventListener(
          "mousedown",
          this.onStepIncrement,
        );
        element.childNodes[1].addEventListener(
          "mousedown",
          this.onStepDecrement,
        );
      }
    }
  }

  componentWillUnmount() {
    if (isNumberInputType(this.props.inputHTMLType) && this.props.onStep) {
      const element: any = document.querySelectorAll(
        `.appsmith_widget_${this.props.widgetId} .bp3-button`,
      );

      if (element !== null && element.childNodes) {
        element.childNodes[0].removeEventListener(
          "click",
          this.onStepIncrement,
        );
        element.childNodes[1].removeEventListener(
          "click",
          this.onStepDecrement,
        );
      }
    }
  }

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
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        compactMode={this.props.compactMode}
        disabled={this.props.disabled}
        fill
        hasError={this.props.isInvalid}
        inputType={this.props.inputType}
        labelStyle={labelStyle}
        labelTextColor={labelTextColor}
        labelTextSize={labelTextSize ? TEXT_SIZES[labelTextSize] : "inherit"}
        multiline={(!!this.props.multiline).toString()}
        numeric={isNumberInputType(this.props.inputHTMLType)}
        primaryColor={this.props.primaryColor}
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
        <TextInputWrapper
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          disabled={this.props.disabled}
          hasError={this.props.isInvalid}
          primaryColor={this.props.primaryColor}
        >
          <ErrorTooltip
            isOpen={this.props.isInvalid && this.props.showError}
            message={
              this.props.errorMessage ||
              createMessage(INPUT_WIDGET_DEFAULT_VALIDATION_ERROR)
            }
          >
            {this.renderInputComponent(
              this.props.inputHTMLType,
              !!this.props.multiline,
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

export interface BaseInputComponentProps extends ComponentProps {
  value: string;
  inputType: InputType;
  inputHTMLType?: InputHTMLType;
  disabled?: boolean;
  intent?: Intent;
  defaultValue?: string | number;
  label: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  tooltip?: string;
  leftIcon?: IconName | JSX.Element;
  allowNumericCharactersOnly?: boolean;
  fill?: boolean;
  errorMessage?: string;
  onValueChange: (valueAsString: string) => void;
  stepSize?: number;
  placeholder?: string;
  isLoading: boolean;
  multiline?: boolean;
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
  maxChars?: number;
  widgetId: string;
  onStep?: (direction: number) => void;
  spellCheck?: boolean;
  maxNum?: number;
  minNum?: number;
  borderRadius?: string;
  boxShadow?: string;
  primaryColor?: string;
}

export default BaseInputComponent;
