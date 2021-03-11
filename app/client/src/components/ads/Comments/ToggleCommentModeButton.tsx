import React from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { ReactComponent as ToggleCommmentMode } from "assets/icons/comments/toggle-comment-mode.svg";
import { setCommentMode as setCommentModeAction } from "actions/commentActions";
import { AppState } from "reducers";

import { getAppsmithConfigs } from "configs";

const { commentsEnabled } = getAppsmithConfigs();

const commentModeSelector = (state: AppState) =>
  state.ui.comments.isCommentMode;

const StyledToggleCommentMode = styled.div<{ isCommentMode: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  background: ${(props) =>
    !props.isCommentMode
      ? props.theme.colors.comments.commentModeButtonBackground
      : props.theme.colors.comments.commentModeButtonIcon};
  svg path {
    fill: ${(props) =>
      props.isCommentMode
        ? "#fff"
        : props.theme.colors.comments.commentModeButtonIcon};
  }

  height: ${(props) => props.theme.smallHeaderHeight};
  width: ${(props) => props.theme.smallHeaderHeight};
`;

const ToggleCommentModeButton = () => {
  const dispatch = useDispatch();
  const isCommentMode = useSelector(commentModeSelector);
  const setCommentMode = () => dispatch(setCommentModeAction(!isCommentMode));

  return commentsEnabled ? (
    <StyledToggleCommentMode
      onClick={setCommentMode}
      isCommentMode={isCommentMode}
    >
      <ToggleCommmentMode />
    </StyledToggleCommentMode>
  ) : null;
};

export default ToggleCommentModeButton;
