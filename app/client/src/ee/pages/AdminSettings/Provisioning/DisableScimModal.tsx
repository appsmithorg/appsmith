import React, { useEffect, useState } from "react";
import {
  Button,
  Callout,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Text,
} from "design-system";
import styled from "styled-components";
import SyncedResourcesInfo from "./SyncedResourcesInfo";
import {
  KEEP_RESOURCES_CALLOUT_ON_MODAL,
  REMOVE_RESOURCES_CALLOUT_ON_MODAL,
  CONNECTION_INACTIVE_CALLOUT_ON_MODAL,
  createMessage,
  DISABLE_SCIM_MODAL_BUTTON,
  DISABLE_SCIM_MODAL_CONFIRMATION,
  KEEP_PROVISIONED_RESOURCES,
  RADIO_GROUP_HEADING,
  REMOVE_PROVISIONED_RESOURCES,
  KEEP_RESOURCES_SUB_TEXT_ON_MODAL,
  REMOVE_RESOURCES_SUB_TEXT_ON_MODAL,
  DISABLE_SCIM_MODAL_TITLE,
} from "@appsmith/constants/messages";
import type { DisableScimModalProps } from "./types";
import { disconnectProvisioning } from "@appsmith/actions/provisioningActions";
import { useDispatch } from "react-redux";
import { StyledAsterisk } from "pages/Settings/FormGroup/Common";
import { useHistory } from "react-router";

const StyledRadioGroup = styled(RadioGroup)`
  gap: var(--ads-v2-spaces-3);
  margin-top: var(--ads-v2-spaces-3);
`;

const StyledCheckbox = styled(Checkbox)`
  margin-top: var(--ads-v2-spaces-5);
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-5);
`;

const Connected = styled.div`
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ads-v2-color-border);
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Heading = styled.div`
  display: flex;
`;

const DisableScimModal = (props: DisableScimModalProps) => {
  const [nextScreen, setNextScreen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [confirmationCheck, setConfirmationCheck] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();
  const { isModalOpen, provisioningDetails, setIsModalOpen } = props;
  const { provisionedGroups, provisionedUsers, provisionStatus } =
    provisioningDetails;
  const showFinalScreen =
    nextScreen || (provisionedUsers === 0 && provisionedGroups === 0);

  useEffect(() => {
    setSelectedOption("");
    setNextScreen(false);
  }, [isModalOpen]);

  const onDisable = () => {
    if (showFinalScreen) {
      dispatch(
        disconnectProvisioning(selectedOption === "keep" ? true : false),
      );
      setIsModalOpen(false);
      history.push("/settings/provisioning");
    }
  };

  return (
    <Modal
      onOpenChange={(isOpen) => isModalOpen && setIsModalOpen(isOpen)}
      open={isModalOpen}
    >
      <ModalContent style={{ width: "640px" }}>
        <ModalHeader>{createMessage(DISABLE_SCIM_MODAL_TITLE)}</ModalHeader>
        <ModalBody>
          {provisionedUsers === 0 && provisionedGroups === 0 && (
            <Container>
              <Callout kind={"warning"}>
                {createMessage(CONNECTION_INACTIVE_CALLOUT_ON_MODAL)}
              </Callout>
            </Container>
          )}
          {provisionStatus === "active" && (
            <>
              <Connected>
                <SyncedResourcesInfo
                  provisioningDetails={provisioningDetails}
                />
              </Connected>
              {!nextScreen ? (
                <>
                  <Heading>
                    <Text>{createMessage(RADIO_GROUP_HEADING)}</Text>&nbsp;
                    <StyledAsterisk renderAs="span">*</StyledAsterisk>
                  </Heading>
                  <StyledRadioGroup
                    onChange={(val: string) => setSelectedOption(val)}
                    value={selectedOption}
                  >
                    <Radio value="remove">
                      {createMessage(REMOVE_PROVISIONED_RESOURCES)}
                    </Radio>
                    <Radio value="keep">
                      {createMessage(KEEP_PROVISIONED_RESOURCES)}
                    </Radio>
                  </StyledRadioGroup>
                </>
              ) : selectedOption === "keep" ? (
                <Container data-testid="keep-resources-callout">
                  <Callout kind={"warning"}>
                    {createMessage(KEEP_RESOURCES_CALLOUT_ON_MODAL)}
                  </Callout>
                  <Text>{createMessage(KEEP_RESOURCES_SUB_TEXT_ON_MODAL)}</Text>
                </Container>
              ) : (
                <Container data-testid="remove-resources-callout">
                  <Callout kind={"warning"}>
                    {createMessage(
                      REMOVE_RESOURCES_CALLOUT_ON_MODAL,
                      provisionedGroups,
                      provisionedUsers,
                    )}
                  </Callout>
                  <Text>
                    {createMessage(REMOVE_RESOURCES_SUB_TEXT_ON_MODAL)}
                  </Text>
                </Container>
              )}
            </>
          )}
          {showFinalScreen && (
            <StyledCheckbox
              onChange={(isSelected: boolean) =>
                setConfirmationCheck(isSelected)
              }
              value="confirm"
            >
              {createMessage(DISABLE_SCIM_MODAL_CONFIRMATION)}
            </StyledCheckbox>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--role-modal-save"
            {...(showFinalScreen ? {} : { endIcon: "arrow-right-line" })}
            isDisabled={
              showFinalScreen
                ? !confirmationCheck
                : !["remove", "keep"].includes(selectedOption)
            }
            onClick={() =>
              showFinalScreen ? onDisable() : setNextScreen(true)
            }
            size="md"
          >
            {createMessage(DISABLE_SCIM_MODAL_BUTTON)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DisableScimModal;
