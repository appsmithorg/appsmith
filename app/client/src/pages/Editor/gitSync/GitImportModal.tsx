import React, { useState } from "react";
import Dialog from "components/ads/DialogComponent";
import {
  getIsGitImportModalOpen,
  getOrganizationIdForImport,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import { setIsGitImportModalOpen } from "actions/gitSyncActions";
import Menu from "./Menu";
import { Classes, MENU_HEIGHT } from "./constants";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";

import GitErrorPopup from "./components/GitErrorPopup";
import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import { Title } from "./components/StyledComponents";
import {
  createMessage,
  IMPORT_FROM_GIT_REPOSITORY,
  IMPORT_FROM_GIT_REPOSITORY_MESSAGE,
  SELECT_A_METHOD_TO_ADD_CREDENTIALS,
} from "constants/messages";
import CredentialMode from "./components/CredentialMode";
import { CREDENTIAL_MODE } from "./constants";
import Button, { Category, Size } from "components/ads/Button";

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

const ButtonContainer = styled.div<{ topMargin: number }>`
  margin-top: ${(props) => `${props.theme.spaces[props.topMargin]}px`};
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[1]}px;
  top: ${(props) => props.theme.spaces[5]}px;

  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

function GitImportModal() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsGitImportModalOpen);
  const organizationId = useSelector(getOrganizationIdForImport);
  const [credentialMode, setCredentialMode] = useState(
    CREDENTIAL_MODE.MANUALLY,
  );
  const handleClose = useCallback(() => {
    dispatch(setIsGitImportModalOpen(false));
  }, [dispatch, setIsGitImportModalOpen]);

  const setActiveTabIndex = useCallback(() => {
    dispatch(setIsGitImportModalOpen(true));
  }, [dispatch, setIsGitImportModalOpen]);

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
        className={Classes.GIT_IMPORT_MODAL}
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
            <Title>{createMessage(IMPORT_FROM_GIT_REPOSITORY)}</Title>
            <Section>
              <Text color={Colors.BLACK} type={TextType.P1}>
                {createMessage(IMPORT_FROM_GIT_REPOSITORY_MESSAGE)}
              </Text>
            </Section>
            <Text color={Colors.BLACK} type={TextType.P1}>
              {createMessage(SELECT_A_METHOD_TO_ADD_CREDENTIALS)}
            </Text>
            <CredentialMode
              defaultValue={CREDENTIAL_MODE.MANUALLY}
              onSelect={(value) => setCredentialMode(value)}
            />
            <ButtonContainer topMargin={10}>
              <Button
                category={Category.primary}
                className="t--add-credential-button"
                // onClick={() => generateSSHKey()}
                size={Size.large}
                tag="button"
                text="Add credentials"
              />
            </ButtonContainer>
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

export default GitImportModal;
