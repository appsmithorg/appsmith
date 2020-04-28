import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledSwitch } from "./StyledControls";
import { ControlType } from "constants/PropertyControlConstants";
import FormLabel from "components/editorComponents/FormLabel";
import { Field, WrappedFieldProps } from "redux-form";

type Props = WrappedFieldProps & SwitchControlProps;

class SwitchField extends React.Component<Props> {
  render() {
    const { label, isRequired, input } = this.props;

    return (
      <div
        style={{
          flexDirection: "row",
          display: "flex",
        }}
      >
        <FormLabel>
          {label} {isRequired && "*"}
        </FormLabel>
        <StyledSwitch
          checked={input.value}
          onChange={value => input.onChange(value)}
          large
        />
      </div>
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
