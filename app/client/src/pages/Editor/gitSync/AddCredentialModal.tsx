import React, { useEffect } from "react";
import Dialog from "components/ads/DialogComponent";
import {
  getIsGitSyncModalOpen,
  getOrganizationIdForImport,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import Menu from "./Menu";
import { Classes, MENU_HEIGHT } from "./constants";
import Icon, { IconSize } from "components/ads/Icon";

import GitErrorPopup from "./components/GitErrorPopup";
import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import { constants } from "os";
import { Title } from "./components/StyledComponents";
import { createMessage } from "constants/messages";

const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
  padding: 0px 10px 0px 10px;
`;

const Section = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[11]}px;
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
  right: ${(props) => props.theme.spaces[1]}px;
  top: ${(props) => props.theme.spaces[5]}px;

  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

function AddCredentialModal() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitSyncModalOpen);
  const organizationId = useSelector(getOrganizationIdForImport);
  const handleClose = useCallback(() => {
    dispatch(setIsGitSyncModalOpen({ isOpen: false }));
  }, [dispatch, setIsGitSyncModalOpen]);

  const setActiveTabIndex = useCallback(
    (index: number) =>
      dispatch(setIsGitSyncModalOpen({ isOpen: !!isModalOpen, tab: index })),
    [dispatch, setIsGitSyncModalOpen, isModalOpen],
  );
  const menuOptions = [
    {
      key: "GIT_IMPORT",
      title: "Git Import",
    },
  ];

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
              activeTabIndex={0}
              onSelect={setActiveTabIndex}
              options={menuOptions}
            />
          </MenuContainer>
          <BodyContainer>
            <Title>Import from Git Repository</Title>
            <Section />
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

export default AddCredentialModal;
