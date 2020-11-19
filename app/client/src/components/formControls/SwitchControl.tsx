import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledSwitch } from "./StyledControls";
import { ControlType } from "constants/PropertyControlConstants";
import FormLabel from "components/editorComponents/FormLabel";
import { Field, WrappedFieldProps } from "redux-form";
import styled from "styled-components";

type Props = WrappedFieldProps & {
  label: string;
  isRequired: boolean;
  info: string;
};

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
`;

const Info = styled.div`
  font-size: 12px;
  opacity: 0.7;
  margin-top: 8px;
`;

export class SwitchField extends React.Component<Props, any> {
  render() {
    const { label, isRequired, input, info } = this.props;

    return (
      <div>
        <SwitchWrapped data-cy={this.props.input.name}>
          <StyledFormLabel>
            {label} {isRequired && "*"}
          </StyledFormLabel>
          <StyledSwitch
            checked={input.value}
            onChange={value => input.onChange(value)}
            large
          />
        </SwitchWrapped>
        {info && <Info>{info}</Info>}
      </div>
    );
  }
}

class SwitchControl extends BaseControl<SwitchControlProps> {
  render() {
    const { configProperty, label, isRequired, info } = this.props;

    return (
      <React.Fragment>
        <Field
          name={configProperty}
          component={SwitchField}
          label={label}
          isRequired={isRequired}
          info={info}
        />
      </React.Fragment>
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
