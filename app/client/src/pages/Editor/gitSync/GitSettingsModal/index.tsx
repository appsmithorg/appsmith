import React, { useMemo } from "react";
import {
  activeGitSettingsModalTabSelector,
  isGitSettingsModalOpenSelector,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { setGitSettingsModalOpenAction } from "actions/gitSyncActions";

import GitErrorPopup from "../components/GitErrorPopup";

import { Modal, ModalBody, ModalContent, ModalHeader } from "design-system";
import styled from "styled-components";
import Menu from "../Menu";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";
import {
  BRANCH,
  CONTINUOUS_DELIVERY,
  GENERAL,
  SETTINGS_GIT,
  createMessage,
} from "@appsmith/constants/messages";
import TabGeneral from "./TabGeneral";
import TabBranch from "./TabBranch";
import GitSettingsCDTab from "@appsmith/components/gitComponents/GitSettingsCDTab";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

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

  const isGitCDEnabled = useFeatureFlag(
    FEATURE_FLAG.release_git_continuous_delivery_enabled,
  );

  const menuOptions = useMemo(() => {
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

    if (isGitCDEnabled) {
      menuOptions.push({
        key: GitSettingsTab.CD,
        title: createMessage(CONTINUOUS_DELIVERY),
      });
    }

    return menuOptions;
  }, [isGitCDEnabled]);

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
          <ModalBody>
            {activeTabKey === GitSettingsTab.GENERAL && <TabGeneral />}
            {activeTabKey === GitSettingsTab.BRANCH && <TabBranch />}
            {isGitCDEnabled && activeTabKey === GitSettingsTab.CD && (
              <GitSettingsCDTab />
            )}
          </ModalBody>
        </StyledModalContent>
      </Modal>
      <GitErrorPopup />
    </>
  );
}

export default GitSettingsModal;
