import React from "react";
import CheckboxField from "components/editorComponents/form/fields/CheckboxField";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import styled from "styled-components";

const StyledCheckbox = styled(CheckboxField)`
  &&& {
    font-size: 14px;
    margin-top: 10px;
  }
`;

class CheckboxControl extends BaseControl<CheckboxControlProps> {
  getControlType(): ControlType {
    return "CHECKBOX";
  }

  render() {
    const { configProperty, info, label } = this.props;

    return <StyledCheckbox info={info} label={label} name={configProperty} />;
  }
}

export interface CheckboxControlProps extends ControlProps {
  info?: string;
}

export default CheckboxControl;
