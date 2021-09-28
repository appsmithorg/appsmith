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
  showUnreadIndicator as showUnreadIndicatorSelector,
} from "../../selectors/commentsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { useLocation } from "react-router";
import history from "utils/history";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { TourType } from "entities/Tour";
import useProceedToNextTourStep, {
  useIsTourStepActive,
} from "utils/hooks/useProceedToNextTourStep";
import { getCommentsIntroSeen } from "utils/storage";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { AppState } from "reducers";
import { APP_MODE } from "entities/App";

import {
  AUTH_LOGIN_URL,
  matchBuilderPath,
  matchViewerPath,
} from "constants/routes";

import localStorage from "utils/localStorage";

import { getAppMode } from "selectors/applicationSelectors";

import { noop } from "lodash";
import {
  commentsTourStepsEditModeTypes,
  commentsTourStepsPublishedModeTypes,
} from "comments/tour/commentsTourSteps";
import AnalyticsUtil from "utils/AnalyticsUtil";

const getShowCommentsButtonToolTip = () => {
  const flag = localStorage.getItem("ShowCommentsButtonToolTip");
  return flag === null || !!flag;
};
const setShowCommentsButtonToolTip = (value = "") =>
  localStorage.setItem("ShowCommentsButtonToolTip", value);

const ModeButton = styled.div<{
  active: boolean;
  showSelectedMode: boolean;
  type: string;
}>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  height: ${(props) => props.theme.smallHeaderHeight};
  width: ${(props) => props.theme.smallHeaderHeight};
  background: ${(props) =>
    props.active && props.showSelectedMode
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
  margin-left: ${(props) => props.theme.smallHeaderHeight};
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
    if (!currentUser) return;

    const searchParams = new URL(window.location.href).searchParams;
    const isCommentMode = searchParams.get("isCommentMode");
    const isCommentsIntroSeen = await getCommentsIntroSeen();
    const updatedIsCommentMode = isCommentMode === "true";

    const notLoggedId = currentUser?.username === ANONYMOUS_USERNAME;

    if (notLoggedId && updatedIsCommentMode) {
      const currentUrl = window.location.href;
      const path = `${AUTH_LOGIN_URL}?redirectUrl=${encodeURIComponent(
        currentUrl,
      )}`;
      history.push(path);

      return;
    }

    if (updatedIsCommentMode && !isCommentsIntroSeen) {
      AnalyticsUtil.logEvent("COMMENTS_ONBOARDING_MODAL_TRIGGERED");
      dispatch(showCommentsIntroCarousel());
      setCommentModeInUrl(false);
    } else {
      setCommentModeInStore(updatedIsCommentMode);
    }
  };

  // sync comment mode in store with comment mode in URL
  useEffect(() => {
    if (window.location.href) {
      handleLocationUpdate();
    }
  }, [location, !!currentUser]);

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
  activeStepConfig: {
    [TourType.COMMENTS_TOUR_EDIT_MODE]:
      commentsTourStepsEditModeTypes.ENTER_COMMENTS_MODE,
    [TourType.COMMENTS_TOUR_PUBLISHED_MODE]:
      commentsTourStepsPublishedModeTypes.ENTER_COMMENTS_MODE,
  },
};

function ViewOrEditMode({ mode }: { mode?: APP_MODE }) {
  return mode === APP_MODE.EDIT ? <EditModeReset /> : <ViewModeReset />;
}

function CommentModeBtn({
  handleSetCommentModeButton,
  isCommentMode,
  showSelectedMode,
  showUnreadIndicator,
}: {
  handleSetCommentModeButton: () => void;
  isCommentMode: boolean;
  showUnreadIndicator: boolean;
  showSelectedMode: boolean;
}) {
  const CommentModeIcon = showUnreadIndicator ? CommentModeUnread : CommentMode;
  const commentModeClassName = showUnreadIndicator
    ? `t--toggle-comment-mode-on--unread`
    : `t--toggle-comment-mode-on`;

  return (
    <ModeButton
      active={isCommentMode}
      className={`t--switch-comment-mode-on ${commentModeClassName}`}
      onClick={handleSetCommentModeButton}
      showSelectedMode={showSelectedMode}
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

const useShowCommentDiscoveryTooltip = (): [boolean, typeof noop] => {
  const currentUser = useSelector(getCurrentUser);
  const appMode = useSelector(getAppMode);

  const initShowCommentButtonDiscoveryTooltip =
    getShowCommentsButtonToolTip() &&
    appMode === APP_MODE.PUBLISHED &&
    currentUser?.username !== ANONYMOUS_USERNAME;

  const [
    showCommentButtonDiscoveryTooltip,
    setShowCommentButtonDiscoveryTooltipInState,
  ] = useState(initShowCommentButtonDiscoveryTooltip);

  useEffect(() => {
    setShowCommentButtonDiscoveryTooltipInState(
      initShowCommentButtonDiscoveryTooltip,
    );
  }, [appMode, currentUser]);

  return [
    showCommentButtonDiscoveryTooltip,
    setShowCommentButtonDiscoveryTooltipInState,
  ];
};

export const useHideComments = () => {
  const [shouldHide, setShouldHide] = useState(false);
  const location = useLocation();
  const currentUser = useSelector(getCurrentUser);
  useEffect(() => {
    const pathName = window.location.pathname;
    const shouldShow = matchBuilderPath(pathName) || matchViewerPath(pathName);
    // Disable comment mode toggle for anonymous users
    setShouldHide(
      !shouldShow ||
        !currentUser ||
        currentUser.username === ANONYMOUS_USERNAME,
    );
  }, [location, currentUser]);

  return shouldHide;
};

type ToggleCommentModeButtonProps = {
  showSelectedMode?: boolean;
};

function ToggleCommentModeButton({
  showSelectedMode = true,
}: ToggleCommentModeButtonProps) {
  const isCommentMode = useSelector(commentModeSelector);
  const currentUser = useSelector(getCurrentUser);

  const [
    showCommentButtonDiscoveryTooltip,
    setShowCommentButtonDiscoveryTooltipInState,
  ] = useShowCommentDiscoveryTooltip();

  const showUnreadIndicator =
    useSelector(showUnreadIndicatorSelector) ||
    showCommentButtonDiscoveryTooltip;

  useUpdateCommentMode(currentUser);

  const activeStepConfig = {
    [TourType.COMMENTS_TOUR_EDIT_MODE]:
      commentsTourStepsEditModeTypes.ENTER_COMMENTS_MODE,
    [TourType.COMMENTS_TOUR_PUBLISHED_MODE]:
      commentsTourStepsPublishedModeTypes.ENTER_COMMENTS_MODE,
  };

  const proceedToNextTourStep = useProceedToNextTourStep(activeStepConfig);

  const isTourStepActive = useIsTourStepActive(activeStepConfig);

  const mode = useSelector((state: AppState) => state.entities.app.mode);

  const handleSetCommentModeButton = useCallback(() => {
    AnalyticsUtil.logEvent("COMMENTS_TOGGLE_MODE", {
      mode: "COMMENT",
      source: "CLICK",
    });
    setCommentModeInUrl(true);
    proceedToNextTourStep();
    setShowCommentButtonDiscoveryTooltipInState(false);
    setShowCommentsButtonToolTip();
  }, [proceedToNextTourStep, setShowCommentButtonDiscoveryTooltipInState]);

  // Show comment mode button only on the canvas editor and viewer
  const isHideComments = useHideComments();

  if (isHideComments) return null;

  return (
    <Container>
      <TourTooltipWrapper {...tourToolTipProps}>
        <div style={{ display: "flex" }}>
          <ModeButton
            active={!isCommentMode}
            className="t--switch-comment-mode-off"
            onClick={() => {
              AnalyticsUtil.logEvent("COMMENTS_TOGGLE_MODE", {
                mode,
                source: "CLICK",
              });
              setCommentModeInUrl(false);
            }}
            showSelectedMode={showSelectedMode}
            type="fill"
          >
            <ViewOrEditMode mode={mode} />
          </ModeButton>
          <CommentModeBtn
            handleSetCommentModeButton={handleSetCommentModeButton}
            isCommentMode={isCommentMode || isTourStepActive} // Highlight the button during the tour
            showSelectedMode={showSelectedMode}
            showUnreadIndicator={showUnreadIndicator}
          />
        </div>
      </TourTooltipWrapper>
    </Container>
  );
}

export default ToggleCommentModeButton;
