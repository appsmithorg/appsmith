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
import {
  CONNECTION_INACTIVE_CALLOUT_ON_MODAL,
  createMessage,
  DISABLE_SCIM_MODAL_BUTTON,
  DISABLE_SCIM_MODAL_CONFIRMATION,
  DISABLE_SCIM_WARNING,
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
import { StyledAsterisk } from "pages/AdminSettings/FormGroup/Common";
import { useHistory } from "react-router";
import ResourceLinks from "./ResourceLinks";
import AnalyticsUtil from "utils/AnalyticsUtil";

const StyledRadioGroup = styled(RadioGroup)`
  gap: var(--ads-v2-spaces-3);
  margin-top: var(--ads-v2-spaces-3);
`;

const SpacedContainer = styled.div`
  margin-bottom: var(--ads-v2-spaces-5);
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-5);
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
  const { provisionedGroups, provisionedUsers } = provisioningDetails;
  const isProvisionedResourcesZero =
    provisionedUsers === 0 && provisionedGroups === 0;
  const showFinalScreen = nextScreen || isProvisionedResourcesZero;

  useEffect(() => {
    setSelectedOption("");
    setNextScreen(false);
  }, [isModalOpen]);

  const onDisable = () => {
    if (showFinalScreen) {
      AnalyticsUtil.logEvent("SCIM_DISABLE_CONFIRMED", {
        linked_users: selectedOption ? `${selectedOption}ed` : "none",
      });
      dispatch(
        disconnectProvisioning(selectedOption === "retain" ? true : false),
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
          {isProvisionedResourcesZero ? (
            <SpacedContainer>
              <Callout kind={"warning"}>
                {createMessage(CONNECTION_INACTIVE_CALLOUT_ON_MODAL)}
              </Callout>
            </SpacedContainer>
          ) : (
            <SpacedContainer>
              {!nextScreen ? (
                <>
                  <SpacedContainer>
                    <Callout kind="warning">
                      {createMessage(DISABLE_SCIM_WARNING)}
                    </Callout>
                  </SpacedContainer>
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
                    <Radio value="retain">
                      {createMessage(KEEP_PROVISIONED_RESOURCES)}
                    </Radio>
                  </StyledRadioGroup>
                </>
              ) : selectedOption === "retain" ? (
                <Wrapper data-testid="keep-resources-callout">
                  <Callout kind={"warning"}>
                    <Text>You have chosen to retain</Text>&nbsp;
                    <ResourceLinks
                      origin="disable_scim_modal"
                      provisionedGroups={provisionedGroups}
                      provisionedUsers={provisionedUsers}
                    />
                    <Text>in Appsmith via this connection.</Text>
                  </Callout>
                  <Text>{createMessage(KEEP_RESOURCES_SUB_TEXT_ON_MODAL)}</Text>
                </Wrapper>
              ) : (
                <Wrapper data-testid="remove-resources-callout">
                  <Callout kind={"warning"}>
                    <Text>You have chosen to remove</Text>&nbsp;
                    <ResourceLinks
                      origin="disable_scim_modal"
                      provisionedGroups={provisionedGroups}
                      provisionedUsers={provisionedUsers}
                    />
                    <Text>in Appsmith via this connection.</Text>
                  </Callout>
                  <Text>
                    {createMessage(REMOVE_RESOURCES_SUB_TEXT_ON_MODAL)}
                  </Text>
                </Wrapper>
              )}
            </SpacedContainer>
          )}
          {showFinalScreen && (
            <Checkbox
              onChange={(isSelected: boolean) =>
                setConfirmationCheck(isSelected)
              }
              value="confirm"
            >
              {createMessage(DISABLE_SCIM_MODAL_CONFIRMATION)}
            </Checkbox>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            data-testid="t--disable-scim-config-button"
            {...(showFinalScreen ? {} : { endIcon: "arrow-right-line" })}
            isDisabled={
              showFinalScreen
                ? !confirmationCheck
                : !["remove", "retain"].includes(selectedOption)
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
