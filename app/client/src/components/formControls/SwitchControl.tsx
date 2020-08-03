import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledSwitch } from "./StyledControls";
import { ControlType } from "constants/PropertyControlConstants";
import FormLabel from "components/editorComponents/FormLabel";
import { Field, WrappedFieldProps } from "redux-form";
import styled from "styled-components";

type Props = WrappedFieldProps & SwitchControlProps;

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

export class SwitchField extends React.Component<Props> {
  render() {
    const { label, isRequired, input } = this.props;

    return (
      <SwitchWrapped>
        <StyledFormLabel>
          {label} {isRequired && "*"}
        </StyledFormLabel>
        <StyledSwitch
          checked={input.value}
          onChange={value => input.onChange(value)}
          large
        />
      </SwitchWrapped>
    );
  }
}

class SwitchControl extends BaseControl<SwitchControlProps> {
  render() {
    const { configProperty } = this.props;

    return (
      <React.Fragment>
        <Field name={configProperty} component={SwitchField} {...this.props} />
      </React.Fragment>
    );
  }

  getControlType(): ControlType {
    return "FILE_PICKER";
  }
}

export type SwitchControlProps = ControlProps;

export default SwitchControl;
