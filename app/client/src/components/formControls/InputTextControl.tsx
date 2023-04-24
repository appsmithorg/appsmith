import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import type { ControlType } from "constants/PropertyControlConstants";
import { TextInput } from "design-system-old";
import type { AppState } from "@appsmith/reducers";
import { Colors } from "constants/Colors";
import styled from "styled-components";
import type { InputType } from "components/constants";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { Field, formValueSelector } from "redux-form";
import { connect } from "react-redux";

export const StyledInfo = styled.span`
  font-weight: normal;
  line-height: normal;
  color: ${Colors.DOVE_GRAY};
  font-size: 12px;
  margin-left: 1px;
`;

const FieldWrapper = styled.div`
  position: relative;
  min-width: 380px;
  max-width: 520px;
`;

const SecretDisplayIndicator = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0px var(--ads-spaces-6);
  z-index: 1;
  cursor: text;
  border: none;
  background: none;
`;

const PASSWORD_EXISTS_INDICATOR = "······";

function renderComponent(
  props: {
    placeholder: string;
    dataType?: InputType;
    disabled?: boolean;
    reference: any;
    validator?: (value: string) => { isValid: boolean; message: string };
  } & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) {
  return (
    <TextInput
      dataType={props.dataType}
      disabled={props.disabled || false}
      name={props.input?.name}
      onChange={props.input.onChange}
      placeholder={props.placeholder}
      ref={props.reference}
      value={props.input.value}
      {...props.input}
      validator={props.validator}
      width="100%"
    />
  );
}

class InputTextControl extends BaseControl<InputControlProps> {
  fieldRef: any;

  state = {
    secretDisplayVisible: false,
  };

  constructor(props: InputControlProps) {
    super(props);
    this.fieldRef = React.createRef();
  }

  onClickSecretDisplayIndicator = () => {
    if (!this.state.secretDisplayVisible) return;
    this.setState({
      secretDisplayVisible: false,
    });

    if (this.fieldRef.current) this.fieldRef.current?.focus();
  };

  checkForSecretOverlayIndicator = () => {
    return (
      this.props.dataType === "PASSWORD" &&
      this.props.isSecretExistsPath &&
      this.props.isSecretExistsData
    );
  };

  onBlur = () => {
    if (
      this.checkForSecretOverlayIndicator() &&
      this.fieldRef.current?.value?.length === 0
    ) {
      this.setState({
        secretDisplayVisible: true,
      });
    }
  };

  componentDidMount() {
    if (this.checkForSecretOverlayIndicator()) {
      this.setState({
        secretDisplayVisible: true,
      });
    }
  }

  render() {
    const {
      configProperty,
      customStyles,
      dataType,
      disabled,
      encrypted,
      isValid,
      label,
      placeholderText,
      propertyValue,
      subtitle,
      validationMessage,
      validator,
    } = this.props;

    return (
      <FieldWrapper data-cy={configProperty} style={customStyles || {}}>
        {this.state.secretDisplayVisible && (
          <SecretDisplayIndicator
            onClick={this.onClickSecretDisplayIndicator}
            onFocus={this.onClickSecretDisplayIndicator}
            type="password"
            value={PASSWORD_EXISTS_INDICATOR}
          />
        )}
        <Field
          asyncControl
          component={renderComponent}
          dataType={this.getType(dataType)}
          disabled={disabled || false}
          encrypted={encrypted}
          isValid={isValid}
          label={label}
          name={configProperty}
          onBlur={this.onBlur}
          onFocus={this.onClickSecretDisplayIndicator}
          placeholder={this.state.secretDisplayVisible ? "" : placeholderText}
          reference={this.fieldRef}
          subtitle={subtitle}
          validationMessage={validationMessage}
          validator={validator}
          value={propertyValue}
        />
      </FieldWrapper>
    );
  }

  isNumberType(): boolean {
    const { inputType } = this.props;
    switch (inputType) {
      case "CURRENCY":
      case "INTEGER":
      case "NUMBER":
      case "PHONE_NUMBER":
        return true;
      default:
        return false;
    }
  }

  getType(dataType: InputType | undefined) {
    switch (dataType) {
      case "PASSWORD":
        return "password";
      case "NUMBER":
        return "number";
      default:
        return "text";
    }
  }
  getControlType(): ControlType {
    return "INPUT_TEXT";
  }
}

export interface InputControlProps extends ControlProps {
  placeholderText: string;
  inputType?: InputType;
  dataType?: InputType;
  subtitle?: string;
  encrypted?: boolean;
  disabled?: boolean;
  validator?: (value: string) => { isValid: boolean; message: string };
  isSecretExistsData?: boolean;
}

const mapStateToProps = (state: AppState, props: InputControlProps) => {
  const valueSelector = formValueSelector(props.formName);
  let isSecretExistsData;
  if (props.isSecretExistsPath) {
    isSecretExistsData = valueSelector(state, props.isSecretExistsPath);
  }
  return {
    isSecretExistsData,
  };
};

export default connect(mapStateToProps)(InputTextControl);
