import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import {
  Switch,
  Link,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
} from "@appsmith/ads";
import type { ControlType } from "constants/PropertyControlConstants";
import type { WrappedFieldProps } from "redux-form";
import { Field } from "redux-form";
import styled from "styled-components";
import {
  SECURITY_MODAL_CONTENT,
  type SecurityModalType,
} from "constants/SecurityModalConstants";
import { createMessage } from "ee/constants/messages";

type SwitchFieldProps = WrappedFieldProps & {
  label: string;
  isRequired: boolean;
  info: string;
  disabled?: boolean;
  modalType?: SecurityModalType;
};

const SwitchWrapped = styled.div`
  flex-direction: row;
  display: flex;
  align-items: center;
  justify-content: end;
  position: relative;
  max-width: 60vw;
`;

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 600px;
  }
`;

export class SwitchWithConfirmationField extends React.Component<
  SwitchFieldProps,
  { isModalOpen: boolean; pendingValue: boolean | null }
> {
  constructor(props: SwitchFieldProps) {
    super(props);
    this.state = {
      isModalOpen: false,
      pendingValue: null,
    };
  }

  /**
   * `redux-form`'s `input.value` can sometimes be a string (e.g. "false").
   * Normalize it to a boolean so the switch + confirmation logic behaves
   * consistently regardless of the serialized value type.
   */
  private getBooleanValue(value: unknown): boolean {
    if (typeof value !== "string") return !!value;

    if (value.toLocaleLowerCase() === "false") return false;

    return !!value;
  }

  handleSwitchChange = (isSelected: boolean) => {
    const currentValue = this.getBooleanValue(this.props.input.value);

    // Only show modal when toggling from ON (true) to OFF (false)
    if (currentValue === true && isSelected === false) {
      this.setState({
        isModalOpen: true,
        pendingValue: isSelected,
      });
    } else {
      // Allow toggling from OFF to ON without confirmation
      this.props.input.onChange(isSelected);
    }
  };

  handleConfirm = () => {
    const { pendingValue } = this.state;

    if (pendingValue !== null) {
      this.props.input.onChange(pendingValue);
    }

    this.setState({
      isModalOpen: false,
      pendingValue: null,
    });
  };

  handleCancel = () => {
    this.setState({
      isModalOpen: false,
      pendingValue: null,
    });
  };

  handleModalOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      this.handleCancel();
    }
  };

  render() {
    const { disabled, modalType } = this.props;
    const { isModalOpen } = this.state;
    const isSelected = this.getBooleanValue(this.props.input.value);

    // Get modal content based on modalType
    const modalContent = modalType ? SECURITY_MODAL_CONTENT[modalType] : null;

    return (
      <>
        <SwitchWrapped data-testid={this.props.input.name}>
          <Switch
            className="switch-control"
            isDisabled={disabled}
            isSelected={isSelected}
            name={this.props.input.name}
            onChange={this.handleSwitchChange}
          />
        </SwitchWrapped>

        {modalContent && (
          <Modal onOpenChange={this.handleModalOpenChange} open={isModalOpen}>
            <StyledModalContent data-testid="t--confirmation-modal">
              <ModalHeader>{createMessage(modalContent.heading)}</ModalHeader>
              <ModalBody>
                <Text kind="body-m">
                  {createMessage(modalContent.description)}
                  {modalContent.learnMore ? (
                    <>
                      {" "}
                      <Link target="_blank" to={modalContent.learnMore.url}>
                        {createMessage(modalContent.learnMore.text)}
                      </Link>
                      .
                    </>
                  ) : null}
                </Text>
              </ModalBody>
              <ModalFooter>
                <Button
                  data-testid="t--confirmation-modal-cancel"
                  kind="secondary"
                  onClick={this.handleCancel}
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  data-testid="t--confirmation-modal-confirm"
                  kind="error"
                  onClick={this.handleConfirm}
                  size="md"
                >
                  Disable
                </Button>
              </ModalFooter>
            </StyledModalContent>
          </Modal>
        )}
      </>
    );
  }
}

class SwitchWithConfirmationControl extends BaseControl<SwitchWithConfirmationControlProps> {
  render() {
    const { configProperty, disabled, info, isRequired, label, modalType } =
      this.props;

    return (
      <Field
        component={SwitchWithConfirmationField}
        disabled={disabled}
        info={info}
        isRequired={isRequired}
        label={label}
        modalType={modalType}
        name={configProperty}
      />
    );
  }

  getControlType(): ControlType {
    return "SWITCH_WITH_CONFIRMATION";
  }
}

export interface SwitchWithConfirmationControlProps extends ControlProps {
  info?: string;
  modalType?: SecurityModalType;
}

export default SwitchWithConfirmationControl;
