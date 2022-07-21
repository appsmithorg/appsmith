import React, { useCallback, useState } from "react";
import Dialog from "components/ads/DialogComponent";
import {
  getDisconnectDocUrl,
  getDisconnectingGitApplication,
  getIsDisconnectGitModalOpen,
} from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import {
  disconnectGit,
  setIsDisconnectGitModalOpen,
} from "actions/gitSyncActions";
import { Classes, MENU_HEIGHT } from "./constants";
import Icon, { IconSize } from "components/ads/Icon";

import styled, { useTheme } from "styled-components";
import { get } from "lodash";
import { Text, TextType } from "design-system";
import InfoWrapper from "./components/InfoWrapper";
import { Colors } from "constants/Colors";
import { Theme } from "constants/DefaultTheme";
import {
  APPLICATION_NAME,
  createMessage,
  GIT_REVOKE_ACCESS,
  GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS,
  LEARN_MORE,
  NONE_REVERSIBLE_MESSAGE,
  REVOKE,
} from "@appsmith/constants/messages";
import Link from "./components/Link";
import TextInput from "components/ads/TextInput";
import Button, { Category, Size } from "components/ads/Button";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Subtitle, Title } from "./components/StyledComponents";
import { Variant } from "components/ads";

const StyledDialog = styled(Dialog)`
  && .bp3-dialog-body {
    margin-top: 0;
  }
`;

const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
  padding: 0;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
    //height: calc(100% - ${MENU_HEIGHT}px);
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
`;

const ButtonContainer = styled.div`
  margin-top: 24px;
`;

function DisconnectGitModal() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsDisconnectGitModalOpen);
  const disconnectingApp = useSelector(getDisconnectingGitApplication);
  const gitDisconnectDocumentUrl = useSelector(getDisconnectDocUrl);
  const [appName, setAppName] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);
  const handleClose = useCallback(() => {
    dispatch(setIsDisconnectGitModalOpen(false));
  }, [dispatch, setIsDisconnectGitModalOpen]);

  const onDisconnectGit = useCallback(() => {
    setIsRevoking(true);
    dispatch(disconnectGit());
  }, [dispatch, disconnectGit]);

  const theme = useTheme() as Theme;

  const shouldDisableRevokeButton =
    disconnectingApp.id === "" ||
    appName !== disconnectingApp.name ||
    isRevoking;

  return (
    <StyledDialog
      canEscapeKeyClose
      canOutsideClickClose
      className={Classes.DISCONNECT_GIT_MODAL}
      isOpen={isModalOpen}
      maxWidth={"900px"}
      onClose={handleClose}
      width={"550px"}
    >
      <Container>
        <BodyContainer>
          <div>
            <Title style={{ marginTop: 0, marginBottom: "8px" }}>
              {createMessage(GIT_REVOKE_ACCESS, disconnectingApp.name)}
            </Title>
            <Subtitle color={Colors.OXFORD_BLUE}>
              {createMessage(
                GIT_TYPE_REPO_NAME_FOR_REVOKING_ACCESS,
                disconnectingApp.name,
              )}
            </Subtitle>
            <CloseBtnContainer
              className="t--close-disconnect-modal"
              onClick={handleClose}
            >
              <Icon
                fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
                name="close-modal"
                size={IconSize.XXXXL}
              />
            </CloseBtnContainer>
          </div>
          <div
            style={{
              margin: `${theme.spaces[11]}px 0px 0`,
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <Text type={TextType.P1}>{createMessage(APPLICATION_NAME)}</Text>
            </div>
            <div style={{ width: "264px" }}>
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
            </div>
          </div>

          <InfoWrapper isError style={{ margin: `${theme.spaces[7]}px 0 0` }}>
            <Icon
              fillColor={Colors.CRIMSON}
              name="warning-line"
              size={IconSize.XXXL}
            />
            <div style={{ display: "block" }}>
              <Text
                color={Colors.CRIMSON}
                style={{ marginRight: theme.spaces[2] }}
                type={TextType.P3}
              >
                {createMessage(NONE_REVERSIBLE_MESSAGE)}
              </Text>
              <Link
                className="t--disconnect-learn-more"
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

          <ButtonContainer>
            <Button
              category={Category.primary}
              className="t--git-revoke-button"
              disabled={shouldDisableRevokeButton}
              onClick={onDisconnectGit}
              size={Size.large}
              tag="button"
              text={createMessage(REVOKE)}
              variant={Variant.danger}
            />
          </ButtonContainer>
        </BodyContainer>
      </Container>
    </StyledDialog>
  );
}

export default DisconnectGitModal;
