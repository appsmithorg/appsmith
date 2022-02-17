import React, { useState } from "react";
import Dialog from "components/ads/DialogComponent";
import {
  getDisconnectDocUrl,
  getDisconnectingGitApplication,
  getIsDisconnectGitModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  disconnectGit,
  setIsDisconnectGitModalOpen,
} from "actions/gitSyncActions";
import { Classes, MENU_HEIGHT } from "./constants";
import Icon, { IconSize } from "components/ads/Icon";

import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import Text, { TextType } from "components/ads/Text";
import InfoWrapper from "./components/InfoWrapper";
import { Colors } from "constants/Colors";
import { Theme } from "constants/DefaultTheme";
import {
  APPLICATION_NAME,
  createMessage,
  DISCONNECT,
  DISCONNECT_FROM_GIT,
  GIT_DISCONNECTION_SUBMENU,
  LEARN_MORE,
  NONE_REVERSIBLE_MESSAGE,
  TYPE_PROMO_CODE,
} from "@appsmith/constants/messages";
import Link from "./components/Link";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Subtitle, Title } from "./components/StyledComponents";

const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
  padding: 0px ${(props) => props.theme.spaces[4]}px;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100% - ${MENU_HEIGHT}px);
`;

const MenuContainer = styled.div`
  height: ${MENU_HEIGHT}px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[1]}px;
  top: ${(props) => props.theme.spaces[5]}px;

  padding: ${(props) => props.theme.spaces[1]}px;
  border-radius: ${(props) => props.theme.radii[1]}px;
`;

const ButtonContainer = styled.div`
  margin-top: ${(props) => `${props.theme.spaces[11]}px`};
`;

function DisconnectGitModal() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsDisconnectGitModalOpen);
  const disconnectingApp = useSelector(getDisconnectingGitApplication);
  const gitDisconnectDocumentUrl = useSelector(getDisconnectDocUrl);
  const [appName, setAppName] = useState("");

  const handleClose = useCallback(() => {
    dispatch(setIsDisconnectGitModalOpen(false));
  }, [dispatch, setIsDisconnectGitModalOpen]);

  const onDisconnectGit = useCallback(() => {
    dispatch(disconnectGit());
  }, [dispatch, disconnectGit]);

  const theme = useTheme() as Theme;
  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      className={Classes.DISCONNECT_GIT_MODAL}
      isOpen={isModalOpen}
      maxWidth={"900px"}
      onClose={handleClose}
      width={"550px"}
    >
      <Container>
        <MenuContainer>
          <Text color={Colors.GREY_4} type={TextType.P3}>
            {createMessage(GIT_DISCONNECTION_SUBMENU)}
          </Text>
        </MenuContainer>
        <BodyContainer>
          <InfoWrapper isError style={{ margin: `${theme.spaces[7]}px 0px` }}>
            <Icon fillColor={Colors.CRIMSON} name="info" size={IconSize.XXXL} />
            <div style={{ display: "block" }}>
              <Text
                color={Colors.CRIMSON}
                style={{ marginRight: theme.spaces[2] }}
                type={TextType.P3}
              >
                {createMessage(NONE_REVERSIBLE_MESSAGE)}
              </Text>
              <Link
                color={Colors.CRIMSON}
                link={gitDisconnectDocumentUrl}
                onClick={() => {
                  AnalyticsUtil.logEvent("GS_GIT_DOCUMENTATION_LINK_CLICK", {
                    source: "GIT_DISCONNECTION_MODAL",
                  });
                  window.open(gitDisconnectDocumentUrl, "_blank");
                }}
                text={createMessage(LEARN_MORE)}
              />
            </div>
          </InfoWrapper>
          <Title>
            {createMessage(DISCONNECT_FROM_GIT, disconnectingApp.name)}
          </Title>
          <Subtitle color={Colors.OXFORD_BLUE}>
            {createMessage(TYPE_PROMO_CODE, disconnectingApp.name)}
          </Subtitle>
          <Text
            style={{
              margin: `${theme.spaces[12] + 2}px 0px ${theme.spaces[3]}px`,
            }}
            type={TextType.P1}
          >
            {createMessage(APPLICATION_NAME)}
          </Text>
          <TextInput
            className="t--git-app-name-input"
            fill
            onBlur={(event) => {
              AnalyticsUtil.logEvent(
                "GS_MATCHING_REPO_NAME_ON_GIT_DISCONNECT_MODAL",
                {
                  value: event.target.value,
                  expecting: disconnectingApp.name,
                },
              );
            }}
            onChange={(value) => setAppName(value)}
            trimValue={false}
            value={appName}
          />
          <ButtonContainer>
            <Button
              category={Category.primary}
              className="t--git-revoke-button"
              disabled={
                disconnectingApp.id === "" || appName !== disconnectingApp.name
              }
              onClick={onDisconnectGit}
              size={Size.large}
              tag="button"
              text={createMessage(DISCONNECT)}
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
  );
}

export default DisconnectGitModal;
