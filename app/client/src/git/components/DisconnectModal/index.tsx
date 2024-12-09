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

interface DisconnectModalProps {
  isModalOpen: boolean;
  disconnectingApp: {
    id: string;
    name: string;
  };
  closeModal: () => void;
  onBackClick: () => void;
  onDisconnect: () => void;
}

const StyledModalContent = styled(ModalContent)`
  width: ${MODAL_WIDTH}px;
`;

function DisconnectModal({
  closeModal,
  disconnectingApp,
  isModalOpen,
  onBackClick,
  onDisconnect,
}: DisconnectModalProps) {
  const [appName, setAppName] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  const onDisconnectGit = useCallback(() => {
    setIsRevoking(true);
    onDisconnect();
  }, [onDisconnect]);

  const shouldDisableRevokeButton =
    disconnectingApp.id === "" ||
    appName !== disconnectingApp.name ||
    isRevoking;

  const onModalOpenValueChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeModal();
      }
    },
    [closeModal],
  );

  const inputOnBlur = useCallback(
    (event: React.FocusEvent<Element, Element>) => {
      AnalyticsUtil.logEvent("GS_MATCHING_REPO_NAME_ON_GIT_DISCONNECT_MODAL", {
        value: "value" in event.target ? event.target.value : "",
        expecting: disconnectingApp.name,
      });
    },
    [disconnectingApp.name],
  );

  const inputOnChange = useCallback((value: string) => {
    setAppName(value);
  }, []);

  return (
    <Modal onOpenChange={onModalOpenValueChange} open={isModalOpen}>
      <StyledModalContent data-testid="t--disconnect-git-modal">
        <ModalHeader>
          {createMessage(GIT_REVOKE_ACCESS, disconnectingApp.name)}
        </ModalHeader>
        <ModalBody>
          <Flex flexDirection="column" gap="spaces-1">
            <Text color={"var(--ads-v2-color-fg-emphasis)"} kind="heading-s">
              {createMessage(
                GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS,
                disconnectingApp.name,
              )}
            </Text>
            <Input
              className="t--git-app-name-input"
              label={createMessage(APPLICATION_NAME)}
              onBlur={inputOnBlur}
              onChange={inputOnChange}
              size="md"
              value={appName}
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
            onClick={onBackClick}
            size="md"
          >
            {createMessage(GO_BACK)}
          </Button>
          <Button
            className="t--git-revoke-button"
            isDisabled={shouldDisableRevokeButton}
            kind="primary"
            onClick={onDisconnectGit}
            size="md"
          >
            {createMessage(REVOKE)}
          </Button>
        </ModalFooter>
      </StyledModalContent>
    </Modal>
  );
}

export default DisconnectModal;
