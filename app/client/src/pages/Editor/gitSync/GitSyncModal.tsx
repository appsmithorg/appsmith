import React, { useEffect } from "react";
import Dialog from "components/ads/DialogComponent";
import {
  getActiveGitSyncModalTab,
  getIsGitSyncModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import Menu from "./Menu";
import { MENU_ITEM, MENU_ITEMS_MAP } from "./constants";
import Deploy from "./Tabs/Deploy";
import Merge from "./Tabs/Merge";
import GitConnection from "./Tabs/GitConnection";
import Icon, { IconSize } from "components/ads/Icon";
import { Classes } from "./constants";

import GitErrorPopup from "./components/GitErrorPopup";
import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import { GitSyncModalTab } from "entities/GitSync";
import { getIsGitConnected } from "selectors/gitSyncSelectors";

const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
  padding: 0px 10px 0px 10px;
`;

const BodyContainer = styled.div`
  flex: 3;
  height: 100%;
`;

const MenuContainer = styled.div``;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[1]}px;
  top: ${(props) => props.theme.spaces[5]}px;

  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

const ComponentsByTab = {
  [MENU_ITEM.GIT_CONNECTION]: GitConnection,
  [MENU_ITEM.DEPLOY]: Deploy,
  [MENU_ITEM.MERGE]: Merge,
};

const allMenuOptions = Object.values(MENU_ITEMS_MAP);

function GitSyncModal() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const isGitConnected = useSelector(getIsGitConnected);
  const activeTabIndex = useSelector(getActiveGitSyncModalTab);

  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
  }, [dispatch, setIsGitSyncModalOpen]);

  const setActiveTabIndex = useCallback(
    (index: number) =>
      dispatch(setIsGitSyncModalOpen({ isOpen: !!isModalOpen, tab: index })),
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
  if (!isGitConnected) {
    menuOptions = [MENU_ITEMS_MAP.GIT_CONNECTION];
  } else {
    menuOptions = allMenuOptions;
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
        isOpen={isModalOpen}
        maxWidth={"900px"}
        onClose={handleClose}
        width={"550px"}
      >
        <Container>
          <MenuContainer>
            <Menu
              activeTabIndex={activeTabIndex}
              onSelect={setActiveTabIndex}
              options={menuOptions}
            />
          </MenuContainer>
          <BodyContainer>
            <BodyComponent />
          </BodyContainer>
          <CloseBtnContainer onClick={handleClose}>
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
