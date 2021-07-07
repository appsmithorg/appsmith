import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import TooltipComponent from "components/ads/Tooltip";
import TourTooltipWrapper from "components/ads/tour/TourTooltipWrapper";
import { ReactComponent as Pen } from "assets/icons/comments/pen.svg";
import { ReactComponent as Eye } from "assets/icons/comments/eye.svg";
import { ReactComponent as CommentModeUnread } from "assets/icons/comments/comment-mode-unread-indicator.svg";
import { ReactComponent as CommentMode } from "assets/icons/comments/chat.svg";
import { Indices } from "constants/Layers";

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
import { AppState } from "reducers";
import { APP_MODE } from "reducers/entityReducers/appReducer";

import { matchBuilderPath, matchViewerPath } from "constants/routes";

import { createMessage, ONE_UNREAD_MESSAGE } from "constants/messages";

import localStorage from "utils/localStorage";

const getShowCommentsButtonToolTip = () => {
  const flag = localStorage.getItem("ShowCommentsButtonToolTip");
  return flag === null || !!flag;
};
const setShowCommentsButtonToolTip = (value = "") =>
  localStorage.setItem("ShowCommentsButtonToolTip", value);

const ModeButton = styled.div<{ active: boolean; type: string }>`
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
      props.type !== "fill"
        ? "transparent"
        : props.active
        ? props.theme.colors.comments.activeModeIcon
        : props.theme.colors.comments.modeIcon};
    stroke: ${(props) =>
      props.type !== "stroke"
        ? "transparent"
        : props.active
        ? props.theme.colors.comments.activeModeIcon
        : props.theme.colors.comments.modeIcon};
  }

  svg rect:not(:first-child) {
    fill: ${(props) =>
      props.active
        ? props.theme.colors.comments.activeModeIcon
        : props.theme.colors.comments.modeIcon};
  }

  svg circle {
    stroke: ${(props) =>
      props.active
        ? props.theme.colors.comments.activeModeIconCircleStroke
        : props.theme.colors.comments.modeIconCircleStroke};
  }
`;

const Container = styled.div`
  display: flex;
  flex: 1;
  z-index: ${Indices.Layer1};
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

function EditModeReset() {
  return (
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
  );
}

function ViewModeReset() {
  return (
    <TooltipComponent
      content={
        <>
          View Mode
          <span style={{ color: "#fff", marginLeft: 20 }}>V</span>
        </>
      }
      hoverOpenDelay={1000}
      position={Position.BOTTOM}
    >
      <Eye />
    </TooltipComponent>
  );
}

const tourToolTipProps = {
  hasOverlay: true,
  modifiers: {
    offset: { enabled: true, offset: "3, 20" },
    arrow: {
      enabled: true,
      fn: (data: any) => ({
        ...data,
        offsets: {
          ...data.offsets,
          arrow: {
            top: -8,
            left: 80,
          },
        },
      }),
    },
  },
  pulseStyles: {
    top: 20,
    left: 28,
    height: 30,
    width: 30,
  },
  showPulse: true,
  tourIndex: 0,
  tourType: [
    TourType.COMMENTS_TOUR_EDIT_MODE,
    TourType.COMMENTS_TOUR_PUBLISHED_MODE,
  ],
};

function ViewOrEditMode({ mode }: { mode?: APP_MODE }) {
  return mode === APP_MODE.EDIT ? <EditModeReset /> : <ViewModeReset />;
}

function CommentModeBtn({
  handleSetCommentModeButton,
  isCommentMode,
  showUnreadIndicator,
}: {
  handleSetCommentModeButton: () => void;
  isCommentMode: boolean;
  showUnreadIndicator: boolean;
}) {
  const CommentModeIcon = showUnreadIndicator ? CommentModeUnread : CommentMode;

  return (
    <ModeButton
      active={isCommentMode}
      className="t--switch-comment-mode-on"
      onClick={handleSetCommentModeButton}
      type="stroke"
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
  );
}

function ToggleCommentModeButton() {
  const commentsEnabled = useSelector(areCommentsEnabledForUserAndAppSelector);
  const isCommentMode = useSelector(commentModeSelector);
  const showUnreadIndicator = useSelector(showUnreadIndicatorSelector);
  const currentUser = useSelector(getCurrentUser);
  const [
    showCommentButtonDiscoveryTooltip,
    setShowCommentButtonDiscoveryTooltipInState,
  ] = useState(getShowCommentsButtonToolTip());

  useUpdateCommentMode(currentUser);
  const proceedToNextTourStep = useProceedToNextTourStep(
    [TourType.COMMENTS_TOUR_EDIT_MODE, TourType.COMMENTS_TOUR_PUBLISHED_MODE],
    0,
  );

  const mode = useSelector((state: AppState) => state.entities.app.mode);

  const handleSetCommentModeButton = useCallback(() => {
    setCommentModeInUrl(true);
    proceedToNextTourStep();
    setShowCommentButtonDiscoveryTooltipInState(false);
    setShowCommentsButtonToolTip();
  }, [proceedToNextTourStep, setShowCommentButtonDiscoveryTooltipInState]);

  // Show comment mode button only on the canvas editor and viewer
  const [shouldHide, setShouldHide] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const pathName = window.location.pathname;
    const shouldShow = matchBuilderPath(pathName) || matchViewerPath(pathName);
    setShouldHide(!shouldShow);
  }, [location]);
  if (shouldHide) return null;

  if (!commentsEnabled) return null;

  return (
    <Container>
      <TourTooltipWrapper {...tourToolTipProps}>
        <div style={{ display: "flex" }}>
          <ModeButton
            active={!isCommentMode}
            onClick={() => setCommentModeInUrl(false)}
            type="fill"
          >
            <ViewOrEditMode mode={mode} />
          </ModeButton>
          <TooltipComponent
            content={createMessage(ONE_UNREAD_MESSAGE)}
            isOpen={showCommentButtonDiscoveryTooltip}
          >
            <CommentModeBtn
              {...{
                handleSetCommentModeButton,
                isCommentMode,
                showUnreadIndicator,
              }}
            />
          </TooltipComponent>
        </div>
      </TourTooltipWrapper>
    </Container>
  );
}

export default ToggleCommentModeButton;
