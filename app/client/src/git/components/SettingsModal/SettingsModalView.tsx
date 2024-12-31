import React, { useCallback } from "react";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Tab,
  Tabs,
  TabsList,
} from "@appsmith/ads";
import styled from "styled-components";
import {
  BRANCH,
  CONTINUOUS_DELIVERY,
  GENERAL,
  SETTINGS_GIT,
  createMessage,
} from "ee/constants/messages";
import TabGeneral from "./TabGeneral";
import TabBranch from "./TabBranch";
import { GitSettingsTab } from "git/constants/enums";
import TabContinuousDelivery from "./TabContinuousDelivery";
import noop from "lodash/noop";

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 600px;
    transform: none !important;
    top: 100px;
    left: calc(50% - 300px);
    max-height: calc(100vh - 200px);
  }
`;

interface SettingsModalViewProps {
  isConnectPermitted: boolean;
  isManageAutocommitPermitted: boolean;
  isManageDefaultBranchPermitted: boolean;
  isManageProtectedBranchesPermitted: boolean;
  isSettingsModalOpen: boolean;
  settingsModalTab: keyof typeof GitSettingsTab;
  toggleSettingsModal: (
    open: boolean,
    tab?: keyof typeof GitSettingsTab,
  ) => void;
}

function SettingsModalView({
  isConnectPermitted = false,
  isManageAutocommitPermitted = false,
  isManageDefaultBranchPermitted = false,
  isManageProtectedBranchesPermitted = false,
  isSettingsModalOpen = false,
  settingsModalTab = GitSettingsTab.General,
  toggleSettingsModal = noop,
}: SettingsModalViewProps) {
  const showBranchTab =
    isManageDefaultBranchPermitted || isManageProtectedBranchesPermitted;

  const handleTabKeyChange = useCallback(
    (tabKey: string) => {
      toggleSettingsModal(true, tabKey as GitSettingsTab);
    },
    [toggleSettingsModal],
  );

  return (
    <Modal onOpenChange={toggleSettingsModal} open={isSettingsModalOpen}>
      <StyledModalContent data-testid="t--git-settings-modal">
        <ModalHeader>{createMessage(SETTINGS_GIT)}</ModalHeader>
        <Tabs onValueChange={handleTabKeyChange} value={settingsModalTab}>
          <TabsList>
            <Tab
              data-testid={"t--git-settings-tab-general"}
              value={GitSettingsTab.General}
            >
              {createMessage(GENERAL)}
            </Tab>
            {showBranchTab && (
              <Tab
                data-testid={"t--git-settings-tab-branch"}
                value={GitSettingsTab.Branch}
              >
                {createMessage(BRANCH)}
              </Tab>
            )}
            <Tab
              data-testid={"t--git-settings-tab-cd"}
              value={GitSettingsTab.ContinuousDelivery}
            >
              {createMessage(CONTINUOUS_DELIVERY)}
            </Tab>
          </TabsList>
        </Tabs>
        <ModalBody>
          {settingsModalTab === GitSettingsTab.General && (
            <TabGeneral
              isConnectPermitted={isConnectPermitted}
              isManageAutocommitPermitted={isManageAutocommitPermitted}
            />
          )}
          {settingsModalTab === GitSettingsTab.Branch && (
            <TabBranch
              isManageDefaultBranchPermitted={isManageDefaultBranchPermitted}
              isManageProtectedBranchesPermitted={
                isManageProtectedBranchesPermitted
              }
            />
          )}
          {settingsModalTab === GitSettingsTab.ContinuousDelivery && (
            <TabContinuousDelivery />
          )}
        </ModalBody>
      </StyledModalContent>
    </Modal>
  );
}

export default SettingsModalView;
