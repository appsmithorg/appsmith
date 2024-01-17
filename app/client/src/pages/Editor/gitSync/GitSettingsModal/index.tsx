import React from "react";
import {
  activeGitSettingsModalTabSelector,
  isGitSettingsModalOpenSelector,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { setGitSettingsModalOpenAction } from "actions/gitSyncActions";

import GitErrorPopup from "../components/GitErrorPopup";

import { Modal, ModalContent, ModalHeader } from "design-system";
import styled from "styled-components";
import Menu from "../Menu";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";
import {
  BRANCH,
  GENERAL,
  SETTINGS_GIT,
  createMessage,
} from "@appsmith/constants/messages";
import TabGeneral from "./TabGeneral";
import TabBranch from "./TabBranch";

const menuOptions = [
  {
    key: GitSettingsTab.GENERAL,
    title: createMessage(GENERAL),
  },
  {
    key: GitSettingsTab.BRANCH,
    title: createMessage(BRANCH),
  },
];

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 640px;
    transform: none !important;
    top: 100px;
    left: calc(50% - 320px);
    max-height: calc(100vh - 200px);
  }
`;

function GitSettingsModal() {
  const isModalOpen = useSelector(isGitSettingsModalOpenSelector);
  const activeTabKey = useSelector(activeGitSettingsModalTabSelector);
  const dispatch = useDispatch();

  const setActiveTabKey = (tabKey: GitSettingsTab) => {
    dispatch(
      setGitSettingsModalOpenAction({
        open: true,
        tab: tabKey,
      }),
    );
  };

  const handleClose = () => {
    dispatch(setGitSettingsModalOpenAction({ open: false }));
  };

  return (
    <>
      <Modal
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
        open={isModalOpen}
      >
        <StyledModalContent data-testid="t--git-settings-modal">
          <ModalHeader>{createMessage(SETTINGS_GIT)}</ModalHeader>
          <Menu
            activeTabKey={activeTabKey}
            onSelect={(tabKey: string) =>
              setActiveTabKey(tabKey as GitSettingsTab)
            }
            options={menuOptions}
          />
          {activeTabKey === GitSettingsTab.GENERAL && <TabGeneral />}
          {activeTabKey === GitSettingsTab.BRANCH && <TabBranch />}
        </StyledModalContent>
      </Modal>
      <GitErrorPopup />
    </>
  );
}

export default GitSettingsModal;
