import React, { MutableRefObject } from "react";
import styled from "styled-components";
import {
  Alignment,
  Intent,
  NumericInput,
  IconName,
  InputGroup,
  Classes,
  ControlGroup,
  TextArea,
  Tag,
  IRef,
} from "@blueprintjs/core";
import _, { isNil } from "lodash";

import { ComponentProps } from "widgets/BaseComponent";
import { Colors } from "constants/Colors";
import {
  createMessage,
  INPUT_WIDGET_DEFAULT_VALIDATION_ERROR,
} from "@appsmith/constants/messages";
import { InputTypes } from "../constants";

// TODO(abhinav): All of the following imports should not be in widgets.
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import Icon from "components/ads/Icon";
import { InputType } from "widgets/InputWidget/constants";
import { getBaseWidgetClassName } from "constants/componentClassNameConstants";
import { LabelPosition } from "components/constants";
import LabelWithTooltip, {
  labelLayoutStyles,
  LABEL_CONTAINER_CLASS,
} from "components/ads/LabelWithTooltip";
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
      "labelPosition",
      "labelStyle",
      "labelTextSize",
      "multiline",
      "numeric",
      "inputType",
      "borderRadius",
      "boxShadow",
      "accentColor",
    ])}
  />
))<{
  numeric: boolean;
  multiline: string;
  hasError: boolean;
  allowCurrencyChange?: boolean;
  disabled?: boolean;
  inputType: InputType;
  compactMode: boolean;
  labelPosition: LabelPosition;
  borderRadius?: string;
  boxShadow?: string;
  accentColor?: string;
}>`
  ${labelLayoutStyles}

  .${Classes.INPUT_GROUP} {
    display: flex;
    background-color: white;

    > {

      &:first-child:not(input) {
        background: ${(props) =>
          props.disabled ? Colors.GREY_1 : Colors.WHITE};
      }
      input:not(:first-child) {
        padding-left: 0rem;
        z-index: 16;
        line-height: 16px;
      }
    }
  }

  &&&& {
    ${({ inputType, labelPosition }) => {
      if (!labelPosition && inputType !== InputTypes.TEXT) {
        return "flex-direction: row";
      }
    }};
    & .${LABEL_CONTAINER_CLASS} {
      flex-grow: 0;
      ${({ inputType, labelPosition }) => {
        if (!labelPosition && inputType !== InputTypes.TEXT) {
          return "flex: 1; margin-right: 5px; label { margin-right: 5px; margin-bottom: 0;}";
        }
      }}
      align-items: centert;
      ${({ compactMode, labelPosition }) => {
        if (!labelPosition && !compactMode) {
          return "max-height: 20px; .bp3-popover-wrapper {max-height: 20px}";
        }
      }};
    }
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
      .${Classes.INPUT} {
        padding-left: 0.5rem;
        min-height: 36px;
        box-shadow: none;
        border: 1px solid;
        border-radius: 0;
        height: ${(props) => (props.multiline === "true" ? "100%" : "inherit")};
        width: 100%;
        border-color: ${({ hasError }) => {
          return hasError
            ? `${Colors.DANGER_SOLID} !important;`
            : `${Colors.GREY_3};`;
        }}
        ${(props) =>
          props.numeric &&
          `
          border-top-right-radius: 0px;
          border-bottom-right-radius: 0px;
          ${props.hasError ? "" : "border-right-width: 0px;"}
        `}
        &:active {
          border-color: ${({ hasError }) =>
            hasError ? Colors.DANGER_SOLID : Colors.HIT_GRAY};
        }
      }
    }

    .currency-type-filter .bp3-popover-open > div,
    .country-type-filter .bp3-popover-open > div {
      border: 0px solid !important;
      box-shadow: none !important;
    }

    .currency-type-filter .bp3-popover-open button
    .country-type-filter .bp3-popover-open button {
      border: 0px solid !important;
      box-shadow: none !important;
      background: ${Colors.GREY_3};
    }

    .${Classes.INPUT} {
      background: ${Colors.WHITE};
      box-shadow: none;
      border-radius: 0;
      height: ${(props) => (props.multiline === "true" ? "100%" : "inherit")};
      width: 100%;

      ${(props) =>
        props.inputType === "PASSWORD" &&
        `
      & + .bp3-input-action {
        height: 100%;
        width: 36px;
        cursor: pointer;

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

    & .${Classes.INPUT_GROUP} {
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
        padding: 0 10px;
        position: relative;

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
    height: 100%;
    align-items: ${({ compactMode, inputType, labelPosition }) => {
      if (!labelPosition && inputType !== InputTypes.TEXT) {
        return "center";
      }
      if (labelPosition === LabelPosition.Top) {
        return "flex-start";
      }
      if (compactMode) {
        return "center";
      }
      if (labelPosition === LabelPosition.Left) {
        if (inputType === InputTypes.TEXT) {
          return "stretch";
        }
        return "center";
      }
      return "flex-start";
    }};
  }
`;

const StyledNumericInput = styled(NumericInput)`
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

const TextInputWrapper = styled.div<{
  inputHtmlType?: InputHTMLType;
  compact: boolean;
  labelPosition?: LabelPosition;
  borderRadius?: string;
  boxShadow?: string;
  accentColor?: string;
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
    border-color: ${({ accentColor, hasError }) =>
      hasError ? Colors.DANGER_SOLID : accentColor};
    box-shadow: ${({ accentColor, hasError }) =>
      `0px 0px 0px 3px ${lightenColor(
        hasError ? Colors.DANGER_SOLID : accentColor,
      )} !important;`};
  }

  ${({ inputHtmlType }) =>
    inputHtmlType && inputHtmlType !== InputTypes.TEXT && `&&& {flex-grow: 0;}`}
`;

export type InputHTMLType = "TEXT" | "NUMBER" | "PASSWORD" | "EMAIL" | "TEL";

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

  componentDidMount() {
    if (isNumberInputType(this.props.inputHTMLType) && this.props.onStep) {
      const element = document.querySelector<HTMLDivElement>(
        `.${getBaseWidgetClassName(this.props.widgetId)} .bp3-button-group`,
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
      const element = document.querySelector<HTMLDivElement>(
        `.${getBaseWidgetClassName(this.props.widgetId)} .bp3-button-group`,
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

  onKeyUp = (
    e:
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    this.props.onKeyUp?.(e);
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
        inputRef={(el) => {
          if (this.props.inputRef && el) {
            this.props.inputRef.current = el;
          }
        }}
        intent={this.props.intent}
        leftIcon={leftIcon}
        majorStepSize={null}
        minorStepSize={null}
        onBlur={() => this.setFocusState(false)}
        onFocus={() => this.setFocusState(true)}
        onKeyDown={this.onKeyDown}
        onKeyUp={this.onKeyUp}
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
      inputRef={this.props.inputRef as IRef<HTMLTextAreaElement>}
      intent={this.props.intent}
      maxLength={this.props.maxChars}
      onBlur={() => this.setFocusState(false)}
      onChange={this.onTextChange}
      onFocus={() => this.setFocusState(true)}
      onKeyDown={this.onKeyDownTextArea}
      onKeyUp={this.onKeyUp}
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
        inputRef={this.props.inputRef as IRef<HTMLInputElement>}
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
        onKeyUp={this.onKeyUp}
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

  onStepIncrement = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onStep && this.props.onStep(1);
  };

  onStepDecrement = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.onStep && this.props.onStep(-1);
  };

  render() {
    const {
      compactMode,
      disabled,
      errorMessage,
      inputHTMLType,
      inputType,
      isInvalid,
      isLoading,
      label,
      labelAlignment,
      labelPosition,
      labelStyle,
      labelTextColor,
      labelTextSize,
      labelWidth,
      multiline,
      showError,
      tooltip,
    } = this.props;
    const showLabelHeader = label || tooltip;

    return (
      <InputComponentWrapper
        compactMode={compactMode}
        data-testid="input-container"
        disabled={disabled}
        fill
        hasError={isInvalid}
        inputType={inputType}
        labelPosition={labelPosition}
        labelStyle={labelStyle}
        labelTextColor={labelTextColor}
        labelTextSize={labelTextSize ?? "inherit"}
        multiline={(!!multiline).toString()}
        numeric={isNumberInputType(inputHTMLType)}
      >
        {showLabelHeader && (
          <LabelWithTooltip
            alignment={labelAlignment}
            className="t--input-widget-label"
            color={labelTextColor}
            compact={compactMode}
            cyHelpTextClassName="t--input-widget-tooltip"
            disabled={disabled}
            fontSize={labelTextSize}
            fontStyle={labelStyle}
            helpText={tooltip}
            loading={isLoading}
            position={labelPosition}
            text={label}
            width={labelWidth}
          />
        )}
        <TextInputWrapper
          accentColor={this.props.accentColor}
          borderRadius={this.props.borderRadius}
          boxShadow={this.props.boxShadow}
          className="text-input-wrapper"
          compact={compactMode}
          hasError={this.props.isInvalid}
          inputHtmlType={inputHTMLType}
          labelPosition={labelPosition}
        >
          <ErrorTooltip
            isOpen={isInvalid && showError}
            message={
              errorMessage ||
              createMessage(INPUT_WIDGET_DEFAULT_VALIDATION_ERROR)
            }
          >
            {this.renderInputComponent(inputHTMLType, !!multiline)}
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
  labelAlignment?: Alignment;
  labelPosition?: LabelPosition;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: string;
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
  onKeyUp?: (
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
  inputRef?: MutableRefObject<
    HTMLTextAreaElement | HTMLInputElement | undefined | null
  >;
  borderRadius?: string;
  boxShadow?: string;
  accentColor?: string;
}

export default BaseInputComponent;
