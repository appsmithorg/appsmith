import React from "react";
import styled from "styled-components";
import { Overlay, Classes } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsGitErrorPopupVisible,
  showCreateBranchPopup,
} from "actions/gitSyncActions";
import {
  getGitError,
  getIsGitErrorPopupVisible,
} from "selectors/gitSyncSelectors";
import Icon from "components/ads/Icon";

import {
  createMessage,
  RETRY,
  CREATE_NEW_BRANCH,
  ERROR_WHILE_PULLING_CHANGES,
} from "constants/messages";
import Button, { Category, Size } from "components/ads/Button";
import { Space } from "./StyledComponents";
import { debug } from "loglevel";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";

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
      min-height: 164px;
      padding: ${(props) => props.theme.spaces[7]}px;

      display: flex;
      flex-direction: column;
    }
  }
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: ${(props) => props.theme.spaces[6]}px;
  top: ${(props) => props.theme.spaces[6]}px;
`;

const Title = styled.div`
  ${(props) => getTypographyByKey(props, "btnMedium")};
  color: ${Colors.POMEGRANATE2};
`;

const Error = styled.div`
  flex: 1;
  overflow-wrap: anywhere;
  word-break: break-word;
  overflow-y: auto;
`;

function GitErrorPopup() {
  const dispatch = useDispatch();
  const isGitErrorPopupVisible = useSelector(getIsGitErrorPopupVisible);
  const hidePopup = () => {
    dispatch(setIsGitErrorPopupVisible({ isVisible: false }));
  };
  const gitError = useSelector(getGitError);

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
            <Title>{createMessage(ERROR_WHILE_PULLING_CHANGES)}</Title>
            <Space size={7} />
            <Error>{gitError}</Error>
            <div style={{ display: "flex" }}>
              <Button
                category={Category.tertiary}
                onClick={() => {
                  debug("retry GIT operation");
                }}
                size={Size.medium}
                tag="button"
                text={createMessage(RETRY)}
              />
              <Space horizontal size={2} />
              <Button
                category={Category.primary}
                onClick={() => dispatch(showCreateBranchPopup())}
                size={Size.medium}
                tag="button"
                text={createMessage(CREATE_NEW_BRANCH)}
              />
            </div>
            <CloseBtnContainer>
              <Icon name="close-modal" onClick={hidePopup} />
            </CloseBtnContainer>
          </div>
        </div>
      </Overlay>
    </StyledGitErrorPopup>
  );
}

export default GitErrorPopup;
