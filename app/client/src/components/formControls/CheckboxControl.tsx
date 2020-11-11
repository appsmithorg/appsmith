import React from "react";
import CheckboxField from "components/editorComponents/form/fields/CheckboxField";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlType } from "constants/PropertyControlConstants";
import styled from "styled-components";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { getFormValues } from "redux-form";
import { isHidden } from "./utils";

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
    const { configProperty, label, hidden } = this.props;

    if (hidden) {
      return null;
    }

    return (
      <StyledCheckbox
        intent="primary"
        name={configProperty}
        align="left"
        label={label}
      />
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: CheckboxControlProps) => {
  const values = getFormValues(ownProps.formName)(state);
  const hidden = isHidden(values, ownProps.hidden);

  return {
    hidden,
  };
};

export type CheckboxControlProps = ControlProps;

export default connect(mapStateToProps)(CheckboxControl);
