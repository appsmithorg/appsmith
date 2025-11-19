import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { Switch } from "@appsmith/ads";
import type { ControlType } from "constants/PropertyControlConstants";
import type { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form";
import styled from "styled-components";
import { connect } from "react-redux";
import {
  showActionConfirmationModal,
} from "actions/pluginActionActions";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import type { ModalInfo } from "reducers/uiReducers/modalActionReducer";

type SwitchFieldProps = WrappedFieldProps & {
  label: string;
  isRequired: boolean;
  info: string;
  disabled: boolean;
};

const SwitchWrapped = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: end;
  position: relative;
  max-width: 60vw;
`;

type SwitchFieldPropsWithDispatch = SwitchFieldProps & {
  dispatch: (action: any) => void;
};

type SecurityToggleMeta = {
  modalName: string;
  modalType: ModalType;
};

const SECURITY_TOGGLE_CONFIG: Record<string, SecurityToggleMeta> = {
  "actionConfiguration.pluginSpecifiedTemplates[0].value": {
    modalName: "disable-prepared-statements",
    modalType: ModalType.DISABLE_PREPARED_STATEMENT,
  },
  "actionConfiguration.formData.preparedStatement.data": {
    modalName: "disable-prepared-statements",
    modalType: ModalType.DISABLE_PREPARED_STATEMENT,
  },
  "actionConfiguration.formData.smartSubstitution.data": {
    modalName: "disable-smart-bson-substitution",
    modalType: ModalType.DISABLE_SMART_SUBSTITUTION,
  },
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class SwitchField extends React.Component<SwitchFieldPropsWithDispatch> {

  get value() {
    const { input } = this.props;

    if (typeof input.value !== "string") return !!input.value;
    else {
      if (input.value.toLocaleLowerCase() === "false") return false;
      else return !!input.value;
    }
  }

  handleSwitchChange = (isSelected: boolean) => {
    const configProperty = this.props.input.name || "";
    const securityMeta = SECURITY_TOGGLE_CONFIG[configProperty];
    const isTurningOff = this.value === true && isSelected === false;

    // Show confirmation dialog when disabling security-sensitive toggles
    if (securityMeta && isTurningOff) {
      const { input, dispatch } = this.props;

      const modalPayload: ModalInfo = {
        name: securityMeta.modalName,
        modalOpen: true,
        modalType: securityMeta.modalType,
        onConfirm: () => {
          // Update the form value when confirmed
          input.onChange(false);
        },
        onCancel: () => {
          // Nothing to do on cancel - the switch will remain in its current state
        },
      };
      dispatch(showActionConfirmationModal(modalPayload));
      return;
    }

    // Normal toggle behavior for other switches or when turning on
    this.props.input.onChange(isSelected);
  };

  render() {
    return (
      <SwitchWrapped data-testid={this.props.input.name}>
        {/* TODO: refactor so that the label of the field props is also passed down and a part of Switch.*/}
        <Switch
          className="switch-control"
          isDisabled={this.props.disabled}
          isSelected={this.value}
          name={this.props.input.name}
          onChange={this.handleSwitchChange}
        />
      </SwitchWrapped>
    );
  }
}

// Connect SwitchField to Redux to access modals and dispatch
const ConnectedSwitchField = connect()(SwitchField);

class SwitchControl extends BaseControl<SwitchControlProps> {
  render() {
    const { configProperty, disabled, info, isRequired, label } = this.props;

    return (
      <Field
        component={ConnectedSwitchField}
        disabled={disabled}
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
