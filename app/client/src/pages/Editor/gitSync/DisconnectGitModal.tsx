import React, { useCallback, useState } from "react";
import {
  getDisconnectDocUrl,
  getDisconnectingGitApplication,
  getIsDisconnectGitModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { revokeGit, setIsDisconnectGitModalOpen } from "actions/gitSyncActions";
import {
  Button,
  Callout,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  Text,
} from "design-system";
import { Colors } from "constants/Colors";
import {
  APPLICATION_NAME,
  createMessage,
  GIT_REVOKE_ACCESS,
  GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS,
  NONE_REVERSIBLE_MESSAGE,
  REVOKE,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Space } from "./components/StyledComponents";
import styled from "styled-components";

const ButtonContainer = styled.div`
  width: 100px;
`;

function DisconnectGitModal() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsDisconnectGitModalOpen);
  const disconnectingApp = useSelector(getDisconnectingGitApplication);
  const gitDisconnectDocumentUrl = useSelector(getDisconnectDocUrl);
  const [appName, setAppName] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);
  const handleClose = useCallback(() => {
    dispatch(setIsDisconnectGitModalOpen(false));
  }, [dispatch, setIsDisconnectGitModalOpen]);

  const onDisconnectGit = useCallback(() => {
    setIsRevoking(true);
    dispatch(revokeGit());
  }, [dispatch, revokeGit]);

  const shouldDisableRevokeButton =
    disconnectingApp.id === "" ||
    appName !== disconnectingApp.name ||
    isRevoking;

  return (
    <Modal open={isModalOpen}>
      <ModalContent>
        <ModalHeader onClose={handleClose}>
          <Text kind="heading-l">
            {createMessage(GIT_REVOKE_ACCESS, disconnectingApp.name)}
          </Text>
        </ModalHeader>
        <Text color={Colors.OXFORD_BLUE}>
          {createMessage(
            GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS,
            disconnectingApp.name,
          )}
        </Text>
        <Space size={2} />
        <Input
          className="t--git-app-name-input"
          label={createMessage(APPLICATION_NAME)}
          onBlur={(event: React.FocusEvent<any, Element>) => {
            AnalyticsUtil.logEvent(
              "GS_MATCHING_REPO_NAME_ON_GIT_DISCONNECT_MODAL",
              {
                value: event.target.value,
                expecting: disconnectingApp.name,
              },
            );
          }}
          onChange={(value: string) => setAppName(value)}
          size="md"
          value={appName}
        />
        <Space size={2} />
        <Callout
          kind="error"
          links={[
            {
              children: "Learn More",
              to: gitDisconnectDocumentUrl,
              className: "t--disconnect-learn-more",
            },
          ]}
        >
          {createMessage(NONE_REVERSIBLE_MESSAGE)}
        </Callout>
        <Space size={2} />
        <ButtonContainer>
          <Button
            className="t--git-revoke-button"
            isDisabled={shouldDisableRevokeButton}
            kind="error"
            onClick={onDisconnectGit}
            size="md"
          >
            {createMessage(REVOKE)}
          </Button>
        </ButtonContainer>
      </ModalContent>
    </Modal>
  );
}

export default DisconnectGitModal;
