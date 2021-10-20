import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import FormLabel from "components/editorComponents/FormLabel";
import Toggle from "components/ads/Toggle";
import { ControlType } from "constants/PropertyControlConstants";
import { Field, WrappedFieldProps } from "redux-form";
import styled from "styled-components";

type SwitchFieldProps = WrappedFieldProps & {
  label: string;
  isRequired: boolean;
  info: string;
};

const StyledToggle = styled(Toggle)`
  .slider {
    margin-left: 10px;
    width: 40px;
    height: 20px;
  }
  .slider::before {
    height: 16px;
    width: 16px;
  }
  input:checked + .slider::before {
    transform: translateX(19px);
  }
`;

const StyledFormLabel = styled(FormLabel)`
  margin-bottom: 0px;
`;

const SwitchWrapped = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
  .bp3-control {
    margin-bottom: 0px;
  }
  max-width: 60vw;
`;

const Info = styled.div`
  font-size: 12px;
  opacity: 0.7;
  margin-top: 8px;
  max-width: 60vw;
`;

export class SwitchField extends React.Component<SwitchFieldProps, any> {
  get value() {
    const { input } = this.props;
    if (typeof input.value !== "string") return !!input.value;
    else {
      if (input.value.toLocaleLowerCase() === "false") return false;
      else return !!input.value;
    }
  }

  render() {
    const { info, input, isRequired, label } = this.props;

    return (
      <div>
        <SwitchWrapped data-cy={this.props.input.name}>
          <StyledFormLabel>
            {label} {isRequired && "*"}
          </StyledFormLabel>
          <StyledToggle
            className="switch-control"
            name={input.name}
            onToggle={(value: any) => {
              input.onChange(value);
            }}
            value={this.value}
          />
        </SwitchWrapped>
        {info && <Info>{info}</Info>}
      </div>
    );
  }
}

class SwitchControl extends BaseControl<SwitchControlProps> {
  render() {
    const { configProperty, info, isRequired, label } = this.props;

    return (
      <Field
        component={SwitchField}
        info={info}
        isRequired={isRequired}
        label={label}
        name={configProperty}
      />
    );
  }

  getControlType(): ControlType {
    return "SWITCH";
  }
}

export interface SwitchControlProps extends ControlProps {
  info?: string;
}

export default SwitchControl;
