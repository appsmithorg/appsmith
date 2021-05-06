import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import TooltipComponent from "components/ads/Tooltip";
import { ReactComponent as Pen } from "assets/icons/comments/pen.svg";
import { ReactComponent as CommentModeUnread } from "assets/icons/comments/comment-mode-unread-indicator.svg";
import { ReactComponent as CommentMode } from "assets/icons/comments/chat.svg";
import {
  setCommentMode as setCommentModeAction,
  fetchApplicationCommentsRequest,
} from "actions/commentActions";
import {
  commentModeSelector,
  areCommentsEnabledForUser as areCommentsEnabledForUserSelector,
  showUnreadIndicator as showUnreadIndicatorSelector,
} from "../../selectors/commentsSelectors";
import { useLocation } from "react-router";
import history from "utils/history";
import { Position } from "@blueprintjs/core/lib/esm/common/position";

const ModeButton = styled.div<{ active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  height: ${(props) => props.theme.smallHeaderHeight};
  width: ${(props) => props.theme.smallHeaderHeight};
  background: ${(props) =>
    props.active
      ? props.theme.colors.comments.activeModeBackground
      : "transparent"};

  svg path {
    fill: ${(props) =>
      props.active
        ? props.theme.colors.comments.activeModeIcon
        : props.theme.colors.comments.modeIcon};
  }
  svg circle {
    stroke: transparent;
  }
`;

const Container = styled.div`
  display: flex;
  flex: 1;
`;

/**
 * Sync comment mode in store with comment mode in URL
 * Fetch app comments when comment mode is selected
 */
const useUpdateCommentMode = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isCommentMode = useSelector(commentModeSelector);

  const setCommentModeInStore = useCallback(
    (updatedIsCommentMode) =>
      dispatch(setCommentModeAction(updatedIsCommentMode)),
    [],
  );

  // sync comment mode in store with comment mode in URL
  useEffect(() => {
    if (window.location.href) {
      const searchParams = new URL(window.location.href).searchParams;
      const isCommentMode = searchParams.get("isCommentMode");
      if (isCommentMode) {
        const updatedIsCommentMode = isCommentMode === "true" ? true : false;
        setCommentModeInStore(updatedIsCommentMode);
      }
    }
  }, [location]);

  // fetch applications comments when comment mode is turned on
  useEffect(() => {
    if (isCommentMode) {
      dispatch(fetchApplicationCommentsRequest());
    }
  }, [isCommentMode]);
};

export const setCommentModeInUrl = (isCommentMode: boolean) => {
  const currentURL = new URL(window.location.href);
  const searchParams = currentURL.searchParams;
  searchParams.set("isCommentMode", `${isCommentMode}`);
  // remove comment link params so that they don't get retriggered
  // on toggling comment mode
  searchParams.delete("commentId");
  searchParams.delete("commentThreadId");
  history.replace({
    pathname: currentURL.pathname,
    search: searchParams.toString(),
    hash: currentURL.hash,
  });
};

function ToggleCommentModeButton() {
  const commentsEnabled = useSelector(areCommentsEnabledForUserSelector);
  const isCommentMode = useSelector(commentModeSelector);
  const showUnreadIndicator = useSelector(showUnreadIndicatorSelector);

  useUpdateCommentMode();

  if (!commentsEnabled) return null;

  const CommentModeIcon = showUnreadIndicator ? CommentModeUnread : CommentMode;

  return (
    <Container>
      <ModeButton
        active={!isCommentMode}
        onClick={() => setCommentModeInUrl(false)}
      >
        <TooltipComponent
          content={
            <>
              Edit Mode<span style={{ color: "#fff", marginLeft: 20 }}>V</span>
            </>
          }
          hoverOpenDelay={1000}
          position={Position.BOTTOM}
        >
          <Pen />
        </TooltipComponent>
      </ModeButton>
      <ModeButton
        active={isCommentMode}
        onClick={() => setCommentModeInUrl(true)}
      >
        <TooltipComponent
          content={
            <>
              Comment Mode
              <span style={{ color: "#fff", marginLeft: 20 }}>C</span>
            </>
          }
          hoverOpenDelay={1000}
          position={Position.BOTTOM}
        >
          <CommentModeIcon />
        </TooltipComponent>
      </ModeButton>
    </Container>
  );
}

export default ToggleCommentModeButton;
