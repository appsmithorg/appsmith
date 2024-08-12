import React, { useCallback, useEffect } from "react";
import {
  getActiveGitSyncModalTab,
  getIsDeploying,
  getIsGitConnected,
  getIsGitSyncModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { setWorkspaceIdForImport } from "ee/actions/applicationActions";
import Menu from "../Menu";
import Deploy from "../Tabs/Deploy";
import Merge from "../Tabs/Merge";
import GitConnection from "../Tabs/GitConnection";

import GitErrorPopup from "../components/GitErrorPopup";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { Modal, ModalContent, ModalHeader } from "@appsmith/ads";
import {
  createMessage,
  GIT_CONNECTION,
  DEPLOY,
  MERGE,
  CONNECT_TO_GIT,
  DEPLOY_YOUR_APPLICATION,
  MERGE_CHANGES,
  GIT_IMPORT,
  IMPORT_FROM_GIT_REPOSITORY,
} from "ee/constants/messages";
import { GitSyncModalTab } from "entities/GitSync";
import { getCurrentApplicationId } from "selectors/editorSelectors";

const ModalContentContainer = styled(ModalContent)`
  min-height: 650px;
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ComponentsByTab: { [K in GitSyncModalTab]?: any } = {
  [GitSyncModalTab.GIT_CONNECTION]: GitConnection,
  [GitSyncModalTab.DEPLOY]: Deploy,
  [GitSyncModalTab.MERGE]: Merge,
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MENU_ITEMS_MAP: { [K in GitSyncModalTab]?: any } = {
  [GitSyncModalTab.GIT_CONNECTION]: {
    key: GitSyncModalTab.GIT_CONNECTION,
    title: createMessage(GIT_CONNECTION),
    modalTitle: createMessage(CONNECT_TO_GIT),
  },
  [GitSyncModalTab.DEPLOY]: {
    key: GitSyncModalTab.DEPLOY,
    title: createMessage(DEPLOY),
    modalTitle: createMessage(DEPLOY_YOUR_APPLICATION),
  },
  [GitSyncModalTab.MERGE]: {
    key: GitSyncModalTab.MERGE,
    title: createMessage(MERGE),
    modalTitle: createMessage(MERGE_CHANGES),
  },
};

const allMenuOptions = Object.values(MENU_ITEMS_MAP);

function GitSyncModalV1(props: { isImport?: boolean }) {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const isDeploying = useSelector(getIsDeploying);
  const isGitConnected = useSelector(getIsGitConnected);

  const activeTabKey = useSelector(getActiveGitSyncModalTab);
  const appId = useSelector(getCurrentApplicationId);

  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
    dispatch(
      setWorkspaceIdForImport({ editorId: appId || "", workspaceId: "" }),
    );
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
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          }
        }}
        open={isModalOpen}
      >
        <ModalContentContainer
          data-testid="t--git-sync-modal"
          style={{ width: "640px" }}
        >
          <ModalHeader>
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
          {activeTabKey !== GitSyncModalTab.GIT_CONNECTION && <BodyComponent />}
        </ModalContentContainer>
      </Modal>
      <GitErrorPopup />
    </>
  );
}

export default GitSyncModalV1;
