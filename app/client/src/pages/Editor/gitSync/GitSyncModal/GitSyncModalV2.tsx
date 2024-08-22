import React, { useCallback } from "react";

import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { setWorkspaceIdForImport } from "ee/actions/applicationActions";
import {
  CONFIGURE_GIT,
  DEPLOY,
  IMPORT_APP,
  MERGE,
  createMessage,
} from "ee/constants/messages";
import { getCurrentAppGitMetaData } from "ee/selectors/applicationSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { GitSyncModalTab } from "entities/GitSync";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import {
  getActiveGitSyncModalTab,
  getIsDeploying,
  getIsGitConnected,
  getIsGitSyncModalOpen,
  protectedModeSelector,
} from "selectors/gitSyncSelectors";
import styled from "styled-components";

import { Modal, ModalContent, ModalHeader } from "@appsmith/ads";

import Menu from "../Menu";
import ConnectionSuccess from "../Tabs/ConnectionSuccess";
import Deploy from "../Tabs/Deploy";
import GitConnectionV2 from "../Tabs/GitConnectionV2";
import Merge from "../Tabs/Merge";
import GitErrorPopup from "../components/GitErrorPopup";
import ReconnectSSHError from "../components/ReconnectSSHError";

const StyledModalContent = styled(ModalContent)`
  &&& {
    width: 640px;
    transform: none !important;
    top: 100px;
    left: calc(50% - 320px);
    max-height: calc(100vh - 200px);
  }
`;

interface GitSyncModalV2Props {
  isImport?: boolean;
}

function GitSyncModalV2({ isImport = false }: GitSyncModalV2Props) {
  const isProtectedMode = useSelector(protectedModeSelector);
  const gitMetadata = useSelector(getCurrentAppGitMetaData);
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const isGitConnected = useSelector(getIsGitConnected);
  const isDeploying = useSelector(getIsDeploying);
  const appId = useSelector(getCurrentApplicationId);

  const menuOptions = [
    {
      key: GitSyncModalTab.DEPLOY,
      title: createMessage(DEPLOY),
      disabled: isProtectedMode,
    },
    {
      key: GitSyncModalTab.MERGE,
      title: createMessage(MERGE),
      disabled: isProtectedMode,
    },
  ];
  const possibleMenuOptions = menuOptions.map((option) => option.key);

  let activeTabKey = useSelector(getActiveGitSyncModalTab);
  if (!isGitConnected && activeTabKey !== GitSyncModalTab.GIT_CONNECTION) {
    activeTabKey = GitSyncModalTab.GIT_CONNECTION;
  }

  const modalTitle: Partial<{ [K in GitSyncModalTab]: string }> = {
    [GitSyncModalTab.GIT_CONNECTION]: isImport
      ? createMessage(IMPORT_APP)
      : createMessage(CONFIGURE_GIT),
  };

  const dispatch = useDispatch();

  const setActiveTabKey = useCallback(
    (tabKey: GitSyncModalTab) => {
      if (tabKey === GitSyncModalTab.DEPLOY) {
        AnalyticsUtil.logEvent("GS_DEPLOY_GIT_MODAL_TRIGGERED", {
          source: `${activeTabKey}_TAB`,
        });
      } else if (tabKey === GitSyncModalTab.MERGE) {
        AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
          source: `${activeTabKey}_TAB`,
        });
      }
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: isModalOpen,
          tab: tabKey,
          isDeploying,
        }),
      );
    },
    [dispatch, setIsGitSyncModalOpen, isModalOpen],
  );

  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
    dispatch(
      setWorkspaceIdForImport({ editorId: appId || "", workspaceId: "" }),
    );
  }, [dispatch, setIsGitSyncModalOpen]);

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
        <StyledModalContent data-testid="t--git-sync-modal">
          <ModalHeader>
            {modalTitle[activeTabKey] || gitMetadata?.repoName}
          </ModalHeader>
          {isGitConnected && <ReconnectSSHError />}
          {possibleMenuOptions.includes(activeTabKey) && (
            <Menu
              activeTabKey={activeTabKey}
              onSelect={(tabKey: string) =>
                setActiveTabKey(tabKey as GitSyncModalTab)
              }
              options={menuOptions}
            />
          )}
          {activeTabKey === GitSyncModalTab.GIT_CONNECTION &&
            (!isGitConnected ? (
              <GitConnectionV2 isImport={isImport} />
            ) : (
              <ConnectionSuccess />
            ))}
          {activeTabKey === GitSyncModalTab.DEPLOY && <Deploy />}
          {activeTabKey === GitSyncModalTab.MERGE && <Merge />}
        </StyledModalContent>
      </Modal>
      <GitErrorPopup />
    </>
  );
}

export default GitSyncModalV2;
