import React, { useMemo } from "react";

import { setGitSettingsModalOpenAction } from "actions/gitSyncActions";
import GitSettingsCDTab from "ee/components/gitComponents/GitSettingsCDTab";
import {
  BRANCH,
  CONTINUOUS_DELIVERY,
  GENERAL,
  SETTINGS_GIT,
  createMessage,
} from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";
import {
  activeGitSettingsModalTabSelector,
  isGitSettingsModalOpenSelector,
} from "selectors/gitSyncSelectors";
import styled from "styled-components";

import { Modal, ModalBody, ModalContent, ModalHeader } from "@appsmith/ads";

import Menu from "../Menu";
import {
  useHasManageDefaultBranchPermission,
  useHasManageProtectedBranchesPermission,
} from "../hooks/gitPermissionHooks";
import TabBranch from "./TabBranch";
import TabGeneral from "./TabGeneral";

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 600px;
    transform: none !important;
    top: 100px;
    left: calc(50% - 300px);
    max-height: calc(100vh - 200px);
  }
`;

function GitSettingsModal() {
  const isManageProtectedBranchesPermitted =
    useHasManageProtectedBranchesPermission();
  const isManageDefaultBranchPermitted = useHasManageDefaultBranchPermission();

  const showBranchTab =
    isManageDefaultBranchPermitted || isManageProtectedBranchesPermitted;

  const isModalOpen = useSelector(isGitSettingsModalOpenSelector);
  const activeTabKey = useSelector(activeGitSettingsModalTabSelector);

  const menuOptions = useMemo(() => {
    const menuOptions = [
      {
        key: GitSettingsTab.GENERAL,
        title: createMessage(GENERAL),
      },
    ];

    if (showBranchTab) {
      menuOptions.push({
        key: GitSettingsTab.BRANCH,
        title: createMessage(BRANCH),
      });
    }

    menuOptions.push({
      key: GitSettingsTab.CD,
      title: createMessage(CONTINUOUS_DELIVERY),
    });

    return menuOptions;
  }, [showBranchTab]);

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
        <ModalBody>
          {activeTabKey === GitSettingsTab.GENERAL && <TabGeneral />}
          {activeTabKey === GitSettingsTab.BRANCH && <TabBranch />}
          {activeTabKey === GitSettingsTab.CD && <GitSettingsCDTab />}
        </ModalBody>
      </StyledModalContent>
    </Modal>
  );
}

export default GitSettingsModal;
