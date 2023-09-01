import React, { useCallback } from "react";
import {
  getActiveGitSyncModalTab,
  getIsGitConnected,
  getIsGitSyncModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { setWorkspaceIdForImport } from "@appsmith/actions/applicationActions";
import Menu from "../Menu";
import Deploy from "../Tabs/Deploy";
import Merge from "../Tabs/Merge";

import GitErrorPopup from "../components/GitErrorPopup";

import {
  CONFIGURE_GIT,
  createMessage,
  DEPLOY,
  DEPLOY_YOUR_APPLICATION,
  MERGE,
  MERGE_CHANGES,
  SETTINGS_GIT,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Modal, ModalContent, ModalHeader } from "design-system";
import { EnvInfoHeader } from "@appsmith/components/EnvInfoHeader";
import GitConnectionV2 from "../Tabs/GitConnectionV2";
import GitSettings from "../Tabs/GitSettings";
import { GitSyncModalTab } from "entities/GitSync";
import ConnectionSuccess from "../Tabs/ConnectionSuccess";

export const modalTitle = {
  [GitSyncModalTab.GIT_CONNECTION]: createMessage(CONFIGURE_GIT),
  [GitSyncModalTab.DEPLOY]: createMessage(DEPLOY_YOUR_APPLICATION),
  [GitSyncModalTab.MERGE]: createMessage(MERGE_CHANGES),
  [GitSyncModalTab.SETTINGS]: createMessage(SETTINGS_GIT),
};

const menuOptions = [
  {
    key: GitSyncModalTab.DEPLOY,
    title: createMessage(DEPLOY),
  },
  {
    key: GitSyncModalTab.MERGE,
    title: createMessage(MERGE),
  },
  {
    key: GitSyncModalTab.SETTINGS,
    title: createMessage(SETTINGS_GIT),
  },
];

const possibleMenuOptions = menuOptions.map((option) => option.key);

interface GitSyncModalV2Props {
  isImport?: boolean;
}

function GitSyncModalV2({ isImport = false }: GitSyncModalV2Props) {
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const isGitConnected = useSelector(getIsGitConnected);

  let activeTabKey = useSelector(getActiveGitSyncModalTab);
  if (!isGitConnected && activeTabKey !== GitSyncModalTab.GIT_CONNECTION) {
    activeTabKey = GitSyncModalTab.GIT_CONNECTION;
  }

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
      } else if (tabKey === GitSyncModalTab.SETTINGS) {
        AnalyticsUtil.logEvent("GS_SETTINGS_GIT_MODAL_TRIGGERED", {
          source: `${activeTabKey}_TAB`,
        });
      }
      dispatch(setIsGitSyncModalOpen({ isOpen: isModalOpen, tab: tabKey }));
    },
    [dispatch, setIsGitSyncModalOpen, isModalOpen],
  );

  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
    dispatch(setWorkspaceIdForImport(""));
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
        <ModalContent
          data-testid="t--git-sync-modal"
          style={{ width: "640px" }}
        >
          <ModalHeader>{modalTitle[activeTabKey]}</ModalHeader>
          <EnvInfoHeader />
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
          {activeTabKey === GitSyncModalTab.SETTINGS && <GitSettings />}
        </ModalContent>
      </Modal>
      <GitErrorPopup />
    </>
  );
}

export default GitSyncModalV2;
