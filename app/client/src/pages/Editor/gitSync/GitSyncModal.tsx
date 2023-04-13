import React, { useCallback, useEffect } from "react";
import {
  getActiveGitSyncModalTab,
  getIsGitConnected,
  getIsGitSyncModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { setWorkspaceIdForImport } from "@appsmith/actions/applicationActions";
import Menu from "./Menu";
import { Classes, MENU_ITEMS_MAP } from "./constants";
import Deploy from "./Tabs/Deploy";
import Merge from "./Tabs/Merge";
import GitConnection from "./Tabs/GitConnection";

import GitErrorPopup from "./components/GitErrorPopup";
import styled from "styled-components";
import { GitSyncModalTab } from "entities/GitSync";
import {
  createMessage,
  GIT_IMPORT,
  IMPORT_FROM_GIT_REPOSITORY,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useGitConnect } from "./hooks";
import { Modal, ModalContent, ModalHeader } from "design-system";

const BodyContainer = styled.div`
  height: 650px;
`;

const ComponentsByTab = {
  [GitSyncModalTab.GIT_CONNECTION]: GitConnection,
  [GitSyncModalTab.DEPLOY]: Deploy,
  [GitSyncModalTab.MERGE]: Merge,
};

const allMenuOptions = Object.values(MENU_ITEMS_MAP);

function GitSyncModal(props: { isImport?: boolean }) {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const isGitConnected = useSelector(getIsGitConnected);
  const activeTabKey = useSelector(getActiveGitSyncModalTab);
  const { onGitConnectFailure: resetGitConnectStatus } = useGitConnect();

  const handleClose = useCallback(() => {
    resetGitConnectStatus();
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
    dispatch(setWorkspaceIdForImport(""));
  }, [dispatch, setIsGitSyncModalOpen]);

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
      dispatch(setIsGitSyncModalOpen({ isOpen: isModalOpen, tab: tabKey }));
    },
    [dispatch, setIsGitSyncModalOpen, isModalOpen],
  );

  useEffect(() => {
    if (!isGitConnected && activeTabKey !== GitSyncModalTab.GIT_CONNECTION) {
      setActiveTabKey(GitSyncModalTab.DEPLOY);
    }
  }, [activeTabKey]);

  useEffect(() => {
    // when git connected
    if (isGitConnected && activeTabKey === GitSyncModalTab.GIT_CONNECTION) {
      setActiveTabKey(GitSyncModalTab.DEPLOY);
    }
  }, [isGitConnected]);

  let menuOptions = allMenuOptions;
  if (props.isImport) {
    menuOptions = [
      {
        key: GitSyncModalTab.GIT_CONNECTION,
        modalTitle: createMessage(IMPORT_FROM_GIT_REPOSITORY),
        title: createMessage(GIT_IMPORT),
      },
    ];
  } else {
    menuOptions = isGitConnected
      ? allMenuOptions
      : [MENU_ITEMS_MAP.GIT_CONNECTION];
  }

  useEffect(() => {
    // onMount or onChange of activeTabKey
    if (
      activeTabKey !== GitSyncModalTab.GIT_CONNECTION &&
      menuOptions.findIndex((option) => option.key === activeTabKey) === -1
    ) {
      setActiveTabKey(GitSyncModalTab.GIT_CONNECTION);
    }
  }, [activeTabKey]);

  const BodyComponent =
    ComponentsByTab[activeTabKey || GitSyncModalTab.GIT_CONNECTION];

  return (
    <>
      <Modal
        data-testid="t--git-sync-modal"
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
        open={isModalOpen}
      >
        <ModalContent>
          <BodyContainer className={Classes.GIT_SYNC_MODAL}>
            <ModalHeader onClose={handleClose}>
              {MENU_ITEMS_MAP[activeTabKey]?.modalTitle ?? ""}
            </ModalHeader>
            <Menu
              activeTabKey={activeTabKey}
              onSelect={(tabKey: string) =>
                setActiveTabKey(tabKey as GitSyncModalTab)
              }
              options={menuOptions}
            />
            {activeTabKey === GitSyncModalTab.GIT_CONNECTION && (
              <BodyComponent isImport={props.isImport} />
            )}
            {activeTabKey !== GitSyncModalTab.GIT_CONNECTION && (
              <BodyComponent />
            )}
          </BodyContainer>
        </ModalContent>
      </Modal>
      <GitErrorPopup />
    </>
  );
}

export default GitSyncModal;
