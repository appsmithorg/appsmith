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
import { Classes, MENU_HEIGHT, MENU_ITEM, MENU_ITEMS_MAP } from "./constants";
import Deploy from "./Tabs/Deploy";
import Merge from "./Tabs/Merge";
import GitConnection from "./Tabs/GitConnection";
import { DialogComponent as Dialog, Icon, IconSize } from "design-system-old";

import GitErrorPopup from "./components/GitErrorPopup";
import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import { GitSyncModalTab } from "entities/GitSync";
import { createMessage, GIT_IMPORT } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useGitConnect } from "./hooks";
import type { Theme } from "constants/DefaultTheme";
import { Indices } from "constants/Layers";

const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const BodyContainer = styled.div`
  flex: 3;
  height: calc(100% - ${MENU_HEIGHT}px);
`;

const MenuContainer = styled.div`
  height: ${MENU_HEIGHT}px;
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: -5px;
  top: 0;
  padding: ${(props) => props.theme.spaces[1]}px 0;
  border-radius: ${(props) => props.theme.radii[1]}px;
  z-index: ${Indices.Layer3};

  &:hover {
    svg,
    svg path {
      fill: ${({ theme }) => get(theme, "colors.gitSyncModal.closeIconHover")};
    }
  }
`;

const ComponentsByTab = {
  [MENU_ITEM.GIT_CONNECTION]: GitConnection,
  [MENU_ITEM.DEPLOY]: Deploy,
  [MENU_ITEM.MERGE]: Merge,
};

const allMenuOptions = Object.values(MENU_ITEMS_MAP);
const TabKeys: string[] = Object.values(GitSyncModalTab)
  .filter((value) => typeof value === "string")
  .map((value) => value as string);

function GitSyncModal(props: { isImport?: boolean }) {
  const theme = useTheme() as Theme;
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const isGitConnected = useSelector(getIsGitConnected);
  const activeTabIndex = useSelector(getActiveGitSyncModalTab);
  const { onGitConnectFailure: resetGitConnectStatus } = useGitConnect();

  const handleClose = useCallback(() => {
    resetGitConnectStatus();
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
    dispatch(setWorkspaceIdForImport(""));
  }, [dispatch, setIsGitSyncModalOpen]);

  const setActiveTabIndex = useCallback(
    (index: number) =>
      dispatch(setIsGitSyncModalOpen({ isOpen: isModalOpen, tab: index })),
    [dispatch, setIsGitSyncModalOpen, isModalOpen],
  );

  useEffect(() => {
    if (!isGitConnected && activeTabIndex !== GitSyncModalTab.GIT_CONNECTION) {
      setActiveTabIndex(GitSyncModalTab.DEPLOY);
    }
  }, [activeTabIndex]);

  useEffect(() => {
    // when git connected
    if (isGitConnected && activeTabIndex === GitSyncModalTab.GIT_CONNECTION) {
      setActiveTabIndex(GitSyncModalTab.DEPLOY);
    }
  }, [isGitConnected]);

  let menuOptions = allMenuOptions;
  if (props.isImport) {
    menuOptions = [
      {
        key: MENU_ITEM.GIT_CONNECTION,
        title: createMessage(GIT_IMPORT),
      },
    ];
  } else {
    menuOptions = isGitConnected
      ? allMenuOptions
      : [MENU_ITEMS_MAP.GIT_CONNECTION];
  }

  useEffect(() => {
    // onMount or onChange of activeTabIndex
    if (
      activeTabIndex !== GitSyncModalTab.GIT_CONNECTION &&
      menuOptions.length - 1 < activeTabIndex
    ) {
      setActiveTabIndex(GitSyncModalTab.GIT_CONNECTION);
    }
  }, [activeTabIndex]);

  const activeMenuItemKey = menuOptions[activeTabIndex]
    ? menuOptions[activeTabIndex].key
    : MENU_ITEMS_MAP.GIT_CONNECTION.key;
  const BodyComponent = ComponentsByTab[activeMenuItemKey];

  return (
    <>
      <Dialog
        canEscapeKeyClose
        canOutsideClickClose
        className={Classes.GIT_SYNC_MODAL}
        data-testid="t--git-sync-modal"
        isOpen={isModalOpen}
        maxWidth={"900px"}
        noModalBodyMarginTop
        onClose={handleClose}
        width={"535px"}
      >
        <Container>
          <MenuContainer>
            <Menu
              activeTabIndex={activeTabIndex}
              onSelect={(tabIndex: number) => {
                if (tabIndex === GitSyncModalTab.DEPLOY) {
                  AnalyticsUtil.logEvent("GS_DEPLOY_GIT_MODAL_TRIGGERED", {
                    source: `${TabKeys[activeTabIndex]}_TAB`,
                  });
                } else if (tabIndex === GitSyncModalTab.MERGE) {
                  AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
                    source: `${TabKeys[activeTabIndex]}_TAB`,
                  });
                }
                setActiveTabIndex(tabIndex);
              }}
              options={menuOptions}
            />
          </MenuContainer>
          <BodyContainer>
            {activeTabIndex === GitSyncModalTab.GIT_CONNECTION && (
              <BodyComponent isImport={props.isImport} />
            )}
            {activeTabIndex !== GitSyncModalTab.GIT_CONNECTION && (
              <BodyComponent />
            )}
          </BodyContainer>
          <CloseBtnContainer
            className="t--close-git-sync-modal"
            onClick={handleClose}
          >
            <Icon
              fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
              name="close-modal"
              size={IconSize.XXXXL}
            />
          </CloseBtnContainer>
        </Container>
      </Dialog>
      <GitErrorPopup />
    </>
  );
}

export default GitSyncModal;
