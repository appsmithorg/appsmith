import React from "react";
import styled, { useTheme } from "styled-components";
import { Overlay, Classes } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { gitPullInit, setIsGitErrorPopupVisible } from "actions/gitSyncActions";
import {
  getIsGitErrorPopupVisible,
  getIsPullingProgress,
} from "selectors/gitSyncSelectors";
import Icon, { IconSize } from "components/ads/Icon";

import {
  createMessage,
  CONFLICTS_FOUND_WHILE_PULLING_CHANGES,
  OPEN_REPO,
  PULL_CHANGES,
  GIT_CONFLICTING_INFO,
  LEARN_MORE,
} from "constants/messages";
import Button, { Category, Size } from "components/ads/Button";
import { Space } from "./StyledComponents";
import { Colors } from "constants/Colors";
import { Theme } from "constants/DefaultTheme";
import { get } from "lodash";
import { getCurrentAppGitMetaData } from "selectors/applicationSelectors";
import InfoWrapper from "./InfoWrapper";
import Link from "./Link";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import Text, { TextType } from "components/ads/Text";

const StyledGitErrorPopup = styled.div`
  & {
    .${Classes.OVERLAY} {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      .${Classes.OVERLAY_CONTENT} {
        overflow: hidden;
        bottom: ${(props) =>
          `calc(${props.theme.bottomBarHeight} + ${props.theme.spaces[3]}px)`};
        left: ${(props) => props.theme.spaces[3]}px;
        background-color: ${Colors.WHITE};
      }
    }
    .git-error-popup {
      width: 364px;
      padding: ${(props) => props.theme.spaces[7]}px;

      display: flex;
      flex-direction: column;
    }
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

function Header({ closePopup }: { closePopup: () => void }) {
  const title = createMessage(CONFLICTS_FOUND_WHILE_PULLING_CHANGES);
  const theme = useTheme();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span className="title">{title}</span>
      </div>
      <Icon
        fillColor={get(theme, "colors.gitSyncModal.closeIcon")}
        hoverFillColor={Colors.BLACK}
        name="close-modal"
        onClick={closePopup}
        size={IconSize.XXXXL}
      />
    </div>
  );
}

function GitErrorPopup() {
  const dispatch = useDispatch();
  const isGitErrorPopupVisible = useSelector(getIsGitErrorPopupVisible);
  const hidePopup = () => {
    dispatch(setIsGitErrorPopupVisible({ isVisible: false }));
  };
  const theme = useTheme() as Theme;
  const gitMetaData = useSelector(getCurrentAppGitMetaData);
  const isPulingProgress = useSelector(getIsPullingProgress);

  const handlePull = () => {
    dispatch(gitPullInit({ triggeredFromBottomBar: true }));
  };

  return (
    <StyledGitErrorPopup>
      <Overlay
        hasBackdrop
        isOpen={isGitErrorPopupVisible}
        onClose={hidePopup}
        transitionDuration={25}
        usePortal={false}
      >
        <div className={Classes.OVERLAY_CONTENT}>
          <div className="git-error-popup">
            <Header closePopup={hidePopup} />
            <Space size={2} />
            <InfoWrapper isError>
              <Text style={{ marginRight: theme.spaces[2] }} type={TextType.P3}>
                {createMessage(GIT_CONFLICTING_INFO)}
              </Text>
              <Link link={DOCS_BASE_URL} text={createMessage(LEARN_MORE)} />
            </InfoWrapper>
            <Row>
              <div style={{ marginRight: theme.spaces[3] }}>
                <Button
                  category={Category.tertiary}
                  className="t--commit-button"
                  href={gitMetaData?.browserSupportedRemoteUrl}
                  size={Size.medium}
                  tag="a"
                  target="_blank"
                  text={createMessage(OPEN_REPO)}
                  width="max-content"
                />
              </div>
              <Button
                className="t--commit-button"
                isLoading={isPulingProgress}
                onClick={handlePull}
                size={Size.medium}
                tag="button"
                text={createMessage(PULL_CHANGES)}
                width="max-content"
              />
            </Row>
          </div>
        </div>
      </Overlay>
    </StyledGitErrorPopup>
  );
}

export default GitErrorPopup;
