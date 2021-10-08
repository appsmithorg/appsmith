import React, { useEffect, useState } from "react";
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

  const showDeployTab = useCallback(() => {
    setActiveTabIndex(GitSyncModalTab.DEPLOY);
  }, [isModalOpen]);

  const gitInitialMenuState = useCallback(() => {
    let initialTabIndex = GitSyncModalTab.GIT_CONNECTION;
    let menuOptions: Array<{ key: MENU_ITEM; title: string }> = [];
    if (!isGitConnected) {
      menuOptions = [MENU_ITEMS_MAP.GIT_CONNECTION];
    } else {
      menuOptions = allMenuOptions;
      // when git is connected directly open deploy tab
      initialTabIndex = menuOptions.findIndex(
        (menuItem) => menuItem.key === MENU_ITEMS_MAP.DEPLOY.key,
      );
    }

    return {
      initialTabIndex,
      menuOptions,
    };
  }, [isGitConnected]);

  const [stateMenuOptions, setStateMenuOptions] = useState(
    gitInitialMenuState().menuOptions,
  );

  useEffect(() => {
    // OnMount set initial state according to git connected to app or not
    const { initialTabIndex, menuOptions } = gitInitialMenuState();

    if (initialTabIndex !== activeTabIndex) {
      setActiveTabIndex(initialTabIndex);
    }
    if (menuOptions.length !== stateMenuOptions.length) {
      setStateMenuOptions(menuOptions);
    }
  }, []);

  useEffect(() => {
    const { initialTabIndex, menuOptions } = gitInitialMenuState();
    if (menuOptions.length !== stateMenuOptions.length) {
      setStateMenuOptions(menuOptions);
    }
    if (initialTabIndex !== activeTabIndex) {
      setActiveTabIndex(initialTabIndex);
    }
  }, [isGitConnected]);

  const activeMenuItemKey = stateMenuOptions[activeTabIndex]
    ? stateMenuOptions[activeTabIndex].key
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
              options={stateMenuOptions}
            />
          </MenuContainer>
          <BodyContainer>
            <BodyComponent onSuccess={showDeployTab} />
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
