import React, { useCallback, useState } from "react";
import {
  Button,
  Callout,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
} from "@appsmith/ads";
import {
  APPLICATION_NAME,
  createMessage,
  GIT_REVOKE_ACCESS,
  GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS,
  GO_BACK,
  NONE_REVERSIBLE_MESSAGE,
  REVOKE,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import styled from "styled-components";
import noop from "lodash/noop";
import { GitSettingsTab } from "git/constants/enums";

const DOCS_URL =
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git/disconnect-the-git-repository";
const DOCS_LINK_PROPS = [
  {
    children: "Learn more",
    to: DOCS_URL,
    className: "t--disconnect-learn-more",
  },
];
const MODAL_WIDTH = 640;

const StyledModalContent = styled(ModalContent)`
  width: ${MODAL_WIDTH}px;
`;

interface DisconnectModalProps {
  closeDisconnectModal: () => void;
  disconnect: () => void;
  disconnectArtifactName: string | null;
  isDisconnectLoading: boolean;
  isDisconnectModalOpen: boolean;
  toggleSettingsModal: (
    open: boolean,
    tab?: keyof typeof GitSettingsTab,
  ) => void;
}

function DisconnectModalView({
  closeDisconnectModal = noop,
  disconnect = noop,
  disconnectArtifactName = null,
  isDisconnectLoading = false,
  isDisconnectModalOpen = false,
  toggleSettingsModal = noop,
}: DisconnectModalProps) {
  const [artifactName, setArtifactName] = useState("");

  const handleClickOnBack = useCallback(() => {
    closeDisconnectModal();
    toggleSettingsModal(true, GitSettingsTab.General);
  }, [closeDisconnectModal, toggleSettingsModal]);

  const handleClickOnDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const shouldDisableRevokeButton =
    artifactName !== disconnectArtifactName || isDisconnectLoading;

  const onModalOpenValueChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDisconnectModal();
      }
    },
    [closeDisconnectModal],
  );

  const inputOnBlur = useCallback(
    (event: React.FocusEvent<Element, Element>) => {
      AnalyticsUtil.logEvent("GS_MATCHING_REPO_NAME_ON_GIT_DISCONNECT_MODAL", {
        value: "value" in event.target ? event.target.value : "",
        expecting: disconnectArtifactName,
      });
    },
    [disconnectArtifactName],
  );

  const inputOnChange = useCallback((value: string) => {
    setArtifactName(value);
  }, []);

  return (
    <Modal onOpenChange={onModalOpenValueChange} open={isDisconnectModalOpen}>
      <StyledModalContent data-testid="t--disconnect-git-modal">
        <ModalHeader>
          {createMessage(GIT_REVOKE_ACCESS, disconnectArtifactName)}
        </ModalHeader>
        <ModalBody>
          <Flex flexDirection="column" gap="spaces-1">
            <Text color={"var(--ads-v2-color-fg-emphasis)"} kind="heading-s">
              {createMessage(
                GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS,
                disconnectArtifactName,
              )}
            </Text>
            <Input
              className="t--git-app-name-input"
              label={createMessage(APPLICATION_NAME)}
              onBlur={inputOnBlur}
              onChange={inputOnChange}
              size="md"
              value={artifactName}
            />
            <Callout kind="error" links={DOCS_LINK_PROPS}>
              {createMessage(NONE_REVERSIBLE_MESSAGE)}
            </Callout>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--git-revoke-back-button"
            kind="secondary"
            onClick={handleClickOnBack}
            size="md"
          >
            {createMessage(GO_BACK)}
          </Button>
          <Button
            className="t--git-revoke-button"
            isDisabled={shouldDisableRevokeButton}
            kind="primary"
            onClick={handleClickOnDisconnect}
            size="md"
          >
            {createMessage(REVOKE)}
          </Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default DisconnectModalView;
