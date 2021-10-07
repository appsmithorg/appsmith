import React, { useEffect } from "react";
import Dialog from "components/ads/DialogComponent";
import {
  getActiveGitSyncModalTab,
  getIsGitSyncModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import styled from "styled-components";
import Menu from "./Menu";
import { MENU_ITEM, MENU_ITEMS_MAP } from "./constants";
import Deploy from "./Tabs/Deploy";
import Merge from "./Tabs/Merge";
import GitConnection from "./Tabs/GitConnection";
import Icon from "components/ads/Icon";
import { Colors } from "constants/Colors";
import { Classes } from "./constants";

import GitErrorPopup from "./components/GitErrorPopup";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";

const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
`;

const BodyContainer = styled.div`
  flex: 3;
  padding-left: ${(props) => props.theme.spaces[11]}px;
  padding-bottom: ${(props) => props.theme.spaces[13]}px;
  padding-right: ${(props) => props.theme.spaces[13]}px;
  overflow-y: auto;
  height: 100%;
`;

const MenuContainer = styled.div`
  padding: ${(props) =>
    `${props.theme.spaces[10]}px ${props.theme.spaces[10]}px ${props.theme.spaces[6]}px;`};
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: 30px;
  top: 34px;
  &:hover {
    background-color: ${(props) => props.theme.colors.modal.hoverState};
  }
  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

// function NoopComponent() {
//   return <div />;
// }

const ComponentsByTab = {
  [MENU_ITEM.GIT_CONNECTION]: GitConnection,
  [MENU_ITEM.DEPLOY]: Deploy,
  [MENU_ITEM.MERGE]: Merge,
  // [MENU_ITEM.SHARE_APPLICATION]: NoopComponent,
  // [MENU_ITEM.SETTINGS]: NoopComponent,
};

const allMenuOptions = Object.values(MENU_ITEMS_MAP);

function GitSyncModal() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
  }, [dispatch, setIsGitSyncModalOpen]);

  const activeTabIndex = useSelector(getActiveGitSyncModalTab);
  const setActiveTabIndex = (index: number) =>
    dispatch(setIsGitSyncModalOpen({ isOpen: true, tab: index }));
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const remoteUrlInStore = gitMetaData?.remoteUrl;
  let initialTabIndex = 0;
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

  const initializeTabIndex = () => {
    if (initialTabIndex !== activeTabIndex) {
      setActiveTabIndex(initialTabIndex);
    }
  };

  useEffect(() => {
    initializeTabIndex();
  }, []);

  const activeMenuItemKey = menuOptions[activeTabIndex]
    ? menuOptions[activeTabIndex].key
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
              options={menuOptions}
            />
          </MenuContainer>
          <BodyContainer>
            <BodyComponent onSuccess={showDeployTab} />
          </BodyContainer>
          <CloseBtnContainer onClick={handleClose}>
            <Icon fillColor={Colors.THUNDER_ALT} name="close-modal" />
          </CloseBtnContainer>
        </Container>
      </Dialog>
      <GitErrorPopup />
    </>
  );
}

export default GitSyncModal;
