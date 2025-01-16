import React, { useCallback, useEffect } from "react";
import TabDeploy from "./TabDeploy";
import TabMerge from "./TabMerge";
import { createMessage, DEPLOY, MERGE } from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  Modal,
  ModalContent,
  ModalHeader,
  Tab,
  Tabs,
  TabsList,
  Tooltip,
} from "@appsmith/ads";
import styled from "styled-components";
// import ReconnectSSHError from "../components/ReconnectSSHError";
import { GitOpsTab } from "git/constants/enums";
import noop from "lodash/noop";
import { isEllipsisActive } from "utils/helpers";

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 640px;
    transform: none !important;
    top: 100px;
    left: calc(50% - 320px);
    max-height: calc(100vh - 200px);
  }
`;

const HeaderText = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 580px;
  display: block;
`;

interface OpsModalViewProps {
  fetchStatus: () => void;
  isOpsModalOpen: boolean;
  isProtectedMode: boolean;
  opsModalTab: keyof typeof GitOpsTab;
  repoName: string | null;
  toggleOpsModal: (open: boolean, tab?: keyof typeof GitOpsTab) => void;
}

function OpsModalView({
  fetchStatus = noop,
  isOpsModalOpen = false,
  isProtectedMode = false,
  opsModalTab = GitOpsTab.Deploy,
  repoName = null,
  toggleOpsModal = noop,
}: OpsModalViewProps) {
  useEffect(
    function fetchStatusOnMountEffect() {
      if (isOpsModalOpen) {
        fetchStatus();
      }
    },
    [isOpsModalOpen, fetchStatus],
  );

  const handleTabKeyChange = useCallback(
    (tabKey: string) => {
      if (tabKey === GitOpsTab.Deploy) {
        AnalyticsUtil.logEvent("GS_DEPLOY_GIT_MODAL_TRIGGERED", {
          source: `${tabKey.toUpperCase()}_TAB`,
        });
      } else if (tabKey === GitOpsTab.Merge) {
        AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
          source: `${tabKey.toUpperCase()}_TAB`,
        });
      }

      toggleOpsModal(true, tabKey as GitOpsTab);
    },
    [toggleOpsModal],
  );

  const headerRef = React.useRef<HTMLSpanElement>(null);
  const [isTextTruncated, setIsTextTruncated] = React.useState(false);

  useEffect(() => {
    if (headerRef.current) {
      const isTruncated = isEllipsisActive(headerRef.current);

      setIsTextTruncated(isTruncated ?? false);
    }
  }, [repoName]);

  return (
    <>
      <Modal onOpenChange={toggleOpsModal} open={isOpsModalOpen}>
        <StyledModalContent data-testid="t--git-ops-modal">
          <ModalHeader>
            <Tooltip
              content={repoName}
              isDisabled={!isTextTruncated}
              placement="bottom"
            >
              <HeaderText ref={headerRef}>{repoName}</HeaderText>
            </Tooltip>
          </ModalHeader>
          {/* {isGitConnected && <ReconnectSSHError />} */}
          <Tabs onValueChange={handleTabKeyChange} value={opsModalTab}>
            <TabsList>
              <Tab
                data-testid={"t--git-ops-tab-deploy"}
                disabled={isProtectedMode}
                value={GitOpsTab.Deploy}
              >
                {createMessage(DEPLOY)}
              </Tab>
              <Tab
                data-testid={"t--git-ops-tab-merge"}
                disabled={isProtectedMode}
                value={GitOpsTab.Merge}
              >
                {createMessage(MERGE)}
              </Tab>
            </TabsList>
          </Tabs>
          {opsModalTab === GitOpsTab.Deploy && <TabDeploy />}
          {opsModalTab === GitOpsTab.Merge && <TabMerge />}
        </StyledModalContent>
      </Modal>
      {/* <GitErrorPopup /> */}
    </>
  );
}

export default OpsModalView;
