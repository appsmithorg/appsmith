import React, { useState } from "react";
import Dialog from "components/ads/DialogComponent";
import { getIsGitSyncModalOpen } from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import styled from "styled-components";
import Menu from "./Menu";
import { Classes } from "./constants";

const Body = styled.div``;

const Container = styled.div`
  height: 70vh;
  width: 100%;
  display: flex;
`;

const MenuContainer = styled.div`
  flex: 1;
  height: 100%;
  background-color: ${(props) =>
    props.theme.colors.gitSyncModal.menuBackgroundColor};
  padding-top: ${(props) => props.theme.spaces[15]}px;
`;

function GitSyncModal() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen(false));
  }, [dispatch, setIsGitSyncModalOpen]);

  const [activeTabIndex, setActiveTabIndex] = useState(0);

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
        <div style={{ flex: 3 }}>
          <Body />
        </div>
      </Container>
    </Dialog>
  );
}

export default GitSyncModal;
