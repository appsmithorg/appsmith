import React, { useState } from "react";
import Dialog from "components/ads/DialogComponent";
import { getIsGitSyncModalOpen } from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import styled from "styled-components";
import Menu from "./Menu";
import { MENU_ITEM, MENU_ITEMS } from "./constants";
import GitConnection from "./GitConnection";
import Icon from "components/ads/Icon";
import { Colors } from "constants/Colors";
import { Classes } from "./constants";

const Container = styled.div`
  height: 70vh;
  width: 100%;
  display: flex;
  position: relative;
`;

const BodyContainer = styled.div`
  flex: 3;
  padding-left: ${(props) => props.theme.spaces[12]}px;
  padding-top: ${(props) => props.theme.spaces[13]}px;
`;

const MenuContainer = styled.div`
  flex: 1;
  height: 100%;
  background-color: ${(props) =>
    props.theme.colors.gitSyncModal.menuBackgroundColor};
  padding-top: ${(props) => props.theme.spaces[15]}px;
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: 55px;
  top: 53px;
  &:hover {
    background-color: ${(props) => props.theme.colors.modal.hoverState};
  }
  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

function NoopComponent() {
  return <div />;
}

const ComponentsByTab = {
  [MENU_ITEM.GIT_CONNECTION]: GitConnection,
  [MENU_ITEM.DEPLOY]: NoopComponent,
  [MENU_ITEM.MERGE]: NoopComponent,
  [MENU_ITEM.SHARE_APPLICATION]: NoopComponent,
  [MENU_ITEM.SETTINGS]: NoopComponent,
};

function GitSyncModal() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen(false));
  }, [dispatch, setIsGitSyncModalOpen]);

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const BodyComponent =
    ComponentsByTab[MENU_ITEMS[activeTabIndex].key as MENU_ITEM];

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      className={Classes.GIT_SYNC_MODAL}
      isOpen={isModalOpen}
      maxWidth={"900px"}
      onClose={handleClose}
      width={"60vw"}
    >
      <Container>
        <MenuContainer>
          <Menu activeTabIndex={activeTabIndex} onSelect={setActiveTabIndex} />
        </MenuContainer>
        <BodyContainer>
          <BodyComponent />
        </BodyContainer>
        <CloseBtnContainer onClick={handleClose}>
          <Icon fillColor={Colors.THUNDER_ALT} name="close-modal" />
        </CloseBtnContainer>
      </Container>
    </Dialog>
  );
}

export default GitSyncModal;
