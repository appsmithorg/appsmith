import React, { useCallback, useState } from "react";
import {
  getDisconnectDocUrl,
  getDisconnectingGitApplication,
  getIsDisconnectGitModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import {
  revokeGit,
  setDisconnectingGitApplication,
  setGitSettingsModalOpenAction,
  setIsDisconnectGitModalOpen,
} from "actions/gitSyncActions";
import {
  Button,
  Callout,
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
import { Space } from "./components/StyledComponents";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";

function DisconnectGitModal() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsDisconnectGitModalOpen);
  const disconnectingApp = useSelector(getDisconnectingGitApplication);
  const gitDisconnectDocumentUrl = useSelector(getDisconnectDocUrl);
  const [appName, setAppName] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  const handleClickOnBack = useCallback(() => {
    dispatch(setIsDisconnectGitModalOpen(false));
    dispatch(
      setGitSettingsModalOpenAction({
        open: true,
        tab: GitSettingsTab.GENERAL,
      }),
    );
    dispatch(setDisconnectingGitApplication({ id: "", name: "" }));
  }, [dispatch]);

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
    <Modal
      onOpenChange={(open: boolean) => {
        if (!open) handleClose();
      }}
      open={isModalOpen}
    >
      <ModalContent
        data-testid="t--disconnect-git-modal"
        style={{ width: "640px" }}
      >
        <ModalHeader>
          {createMessage(GIT_REVOKE_ACCESS, disconnectingApp.name)}
        </ModalHeader>
        <ModalBody>
          <Text color={"var(--ads-v2-color-fg-emphasis)"} kind="heading-s">
            {createMessage(
              GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS,
              disconnectingApp.name,
            )}
          </Text>
          <Space size={2} />
          <Input
            className="t--git-app-name-input"
            label={createMessage(APPLICATION_NAME)}
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                children: "Learn more",
                to: gitDisconnectDocumentUrl,
                className: "t--disconnect-learn-more",
              },
            ]}
          >
            {createMessage(NONE_REVERSIBLE_MESSAGE)}
          </Callout>
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
            onClick={onDisconnectGit}
            size="md"
          >
            {createMessage(REVOKE)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DisconnectGitModal;
