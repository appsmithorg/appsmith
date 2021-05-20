import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import TooltipComponent from "components/ads/Tooltip";
import TourTooltipWrapper from "components/ads/tour/TourTooltipWrapper";
import { ReactComponent as Pen } from "assets/icons/comments/pen.svg";
import { ReactComponent as CommentModeUnread } from "assets/icons/comments/comment-mode-unread-indicator.svg";
import { ReactComponent as CommentMode } from "assets/icons/comments/chat.svg";

import {
  setCommentMode as setCommentModeAction,
  fetchApplicationCommentsRequest,
  showCommentsIntroCarousel,
} from "actions/commentActions";
import {
  commentModeSelector,
  areCommentsEnabledForUserAndApp as areCommentsEnabledForUserAndAppSelector,
  showUnreadIndicator as showUnreadIndicatorSelector,
} from "../../selectors/commentsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { useLocation } from "react-router";
import history from "utils/history";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { TourType } from "entities/Tour";
import useProceedToNextTourStep from "utils/hooks/useProceedToNextTourStep";
import { getCommentsIntroSeen } from "utils/storage";
import { User } from "constants/userConstants";

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
// eslint-disable-next-line
const useUpdateCommentMode = async (currentUser?: User) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const isCommentMode = useSelector(commentModeSelector);

  const setCommentModeInStore = useCallback(
    (updatedIsCommentMode) =>
      dispatch(setCommentModeAction(updatedIsCommentMode)),
    [],
  );

  const handleLocationUpdate = async () => {
    const searchParams = new URL(window.location.href).searchParams;
    const isCommentMode = searchParams.get("isCommentMode");
    const isCommentsIntroSeen = await getCommentsIntroSeen();
    const updatedIsCommentMode = isCommentMode === "true" ? true : false;

    if (updatedIsCommentMode && !isCommentsIntroSeen) {
      dispatch(showCommentsIntroCarousel());
    } else {
      setCommentModeInStore(updatedIsCommentMode);
    }
  };

  // sync comment mode in store with comment mode in URL
  useEffect(() => {
    if (window.location.href) {
      handleLocationUpdate();
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
  const commentsEnabled = useSelector(areCommentsEnabledForUserAndAppSelector);
  const isCommentMode = useSelector(commentModeSelector);
  const showUnreadIndicator = useSelector(showUnreadIndicatorSelector);
  const currentUser = useSelector(getCurrentUser);

  useUpdateCommentMode(currentUser);
  const proceedToNextTourStep = useProceedToNextTourStep(
    TourType.COMMENTS_TOUR,
    0,
  );

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
              Edit Mode
              <span style={{ color: "#fff", marginLeft: 20 }}>V</span>
            </>
          }
          hoverOpenDelay={1000}
          position={Position.BOTTOM}
        >
          <Pen />
        </TooltipComponent>
      </ModeButton>
      <TourTooltipWrapper
        onClick={() => {
          proceedToNextTourStep();
        }}
        tourIndex={0}
        tourType={TourType.COMMENTS_TOUR}
      >
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
      </TourTooltipWrapper>
    </Container>
  );
}

export default ToggleCommentModeButton;
