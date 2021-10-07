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
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import { GitSyncModalTab } from "../../../entities/GitSync";

const Container = styled.div`
  height: 656px;
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
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);

  const theme = useTheme();

  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
  }, [dispatch, setIsGitSyncModalOpen]);

  const activeTabIndex = useSelector(getActiveGitSyncModalTab);
  const setActiveTabIndex = (index: number) =>
    dispatch(setIsGitSyncModalOpen({ isOpen: !!isModalOpen, tab: index }));
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const remoteUrlInStore = gitMetaData?.remoteUrl;

  const gitInitialMenuState = useCallback(() => {
    let initialTabIndex = GitSyncModalTab.GIT_CONNECTION;
    let menuOptions: Array<{ key: MENU_ITEM; title: string }> = [];
    if (!remoteUrlInStore) {
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
  }, [remoteUrlInStore]);

  const [stateMenuOptions, setStateMenuOptions] = useState(
    gitInitialMenuState().menuOptions,
  );

  useEffect(() => {
    // OnMount
    const { initialTabIndex, menuOptions } = gitInitialMenuState();

    if (initialTabIndex !== activeTabIndex) {
      setActiveTabIndex(initialTabIndex);
    }
    if (menuOptions.length !== stateMenuOptions.length) {
      setStateMenuOptions(menuOptions);
    }
  }, []);

  useEffect(() => {
    const { initialTabIndex } = gitInitialMenuState();

    if (initialTabIndex !== activeTabIndex) {
      setActiveTabIndex(initialTabIndex);
    }
  }, [isModalOpen]);

  const activeMenuItemKey = stateMenuOptions[activeTabIndex]
    ? stateMenuOptions[activeTabIndex].key
    : MENU_ITEMS_MAP.GIT_CONNECTION.key;
  const BodyComponent = ComponentsByTab[activeMenuItemKey];

  const showDeployTab = () => {
    setActiveTabIndex(1);
  };
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
