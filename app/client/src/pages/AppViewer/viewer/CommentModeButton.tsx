import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import TooltipComponent from "components/ads/Tooltip";
import TourTooltipWrapper from "components/ads/tour/TourTooltipWrapper";
import CommentIcon from "remixicon-react/MessageLineIcon";
import { Indices } from "constants/Layers";

import {
  setCommentMode as setCommentModeAction,
  fetchApplicationCommentsRequest,
  showCommentsIntroCarousel,
} from "actions/commentActions";
import { commentModeSelector } from "selectors/commentsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { useLocation } from "react-router";
import history from "utils/history";
import { Position } from "@blueprintjs/core/lib/esm/common/position";
import { TourType } from "entities/Tour";
import useProceedToNextTourStep, {
  useIsTourStepActive,
} from "utils/hooks/useProceedToNextTourStep";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { APP_MODE } from "entities/App";

import { AUTH_LOGIN_URL } from "constants/routes";

import {
  commentsTourStepsEditModeTypes,
  commentsTourStepsPublishedModeTypes,
} from "comments/tour/commentsTourSteps";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { getAppMode } from "selectors/applicationSelectors";
import { setPreviewModeAction } from "actions/editorActions";

import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import {
  setCommentModeInUrl,
  useHasUnreadCommentThread,
  useHideComments,
} from "pages/Editor/ToggleModeButton";
import { useMediaQuery } from "react-responsive";
import classNames from "classnames";

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
  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });
  const isCommentMode = useSelector(commentModeSelector);
  const setCommentModeInStore = useCallback(
    (updatedIsCommentMode) =>
      dispatch(setCommentModeAction(updatedIsCommentMode)),
    [],
  );
  const currentBranch = useSelector(getCurrentGitBranch);

  const handleLocationUpdate = async () => {
    if (!currentUser) return;

    const searchParams = new URL(window.location.href).searchParams;
    const isCommentMode = searchParams.get("isCommentMode");
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

    if (updatedIsCommentMode && !currentUser?.commentOnboardingState) {
      AnalyticsUtil.logEvent("COMMENTS_ONBOARDING_MODAL_TRIGGERED");
      dispatch(showCommentsIntroCarousel());
      setCommentModeInUrl(false);
    } else {
      setCommentModeInStore(updatedIsCommentMode);
    }
  };

  // sync comment mode in store with comment mode in URL
  useEffect(() => {
    if (window.location.href && !isMobile) {
      handleLocationUpdate();
    }
  }, [location, !!currentUser]);

  // fetch applications comments when comment mode is turned on
  useEffect(() => {
    dispatch(fetchApplicationCommentsRequest());
  }, [isCommentMode, currentBranch]);
};

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

function CommentModeBtn({
  handleSetCommentModeButton,
  showUnreadIndicator,
}: {
  handleSetCommentModeButton: () => void;
  isCommentMode: boolean;
  showUnreadIndicator: boolean;
  showSelectedMode: boolean;
}) {
  const commentModeClassName = showUnreadIndicator
    ? `t--toggle-comment-mode-on--unread`
    : `t--toggle-comment-mode-on`;

  return (
    <button
      className={`t--switch-comment-mode-on w-full ${commentModeClassName}`}
      onClick={handleSetCommentModeButton}
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
        <div className="relative flex items-center justify-center space-x-2">
          <CommentIcon className="w-5 h-5 text-gray-700" />
          {showUnreadIndicator && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          )}
          <span className="md:hidden">Comments</span>
        </div>
      </TooltipComponent>
    </button>
  );
}

type CommentModeButtonProps = {
  showSelectedMode?: boolean;
};

function CommentModeButton({
  showSelectedMode = true,
}: CommentModeButtonProps) {
  const dispatch = useDispatch();
  const isCommentMode = useSelector(commentModeSelector);
  const currentUser = useSelector(getCurrentUser);
  const appId = useSelector(getCurrentApplicationId) || "";
  const appMode = useSelector(getAppMode);
  const hasUnreadCommentThread = useHasUnreadCommentThread(appId);

  // show comments indicator only if -
  // 1. user hasn't completed their comments onboarding and they are in published mode or
  // 2. There is at least one unread comment thread
  const showUnreadIndicator =
    hasUnreadCommentThread ||
    (!currentUser?.commentOnboardingState &&
      appMode === APP_MODE.PUBLISHED &&
      currentUser?.username !== ANONYMOUS_USERNAME);

  useUpdateCommentMode(currentUser);

  const activeStepConfig = {
    [TourType.COMMENTS_TOUR_EDIT_MODE]:
      commentsTourStepsEditModeTypes.ENTER_COMMENTS_MODE,
    [TourType.COMMENTS_TOUR_PUBLISHED_MODE]:
      commentsTourStepsPublishedModeTypes.ENTER_COMMENTS_MODE,
  };

  const proceedToNextTourStep = useProceedToNextTourStep(activeStepConfig);

  const isTourStepActive = useIsTourStepActive(activeStepConfig);

  const handleSetCommentModeButton = useCallback(() => {
    AnalyticsUtil.logEvent("COMMENTS_TOGGLE_MODE", {
      mode: "COMMENT",
      source: "CLICK",
    });
    setCommentModeInUrl(!isCommentMode);
    dispatch(setPreviewModeAction(false));
    proceedToNextTourStep();
  }, [proceedToNextTourStep]);

  // Show comment mode button only on the canvas editor and viewer
  const isHideComments = useHideComments();

  if (isHideComments) return null;

  return (
    <Container
      className={classNames({
        "mx-1 t--comment-mode-switch-toggle h-8 w-8 hover:bg-gray-100": true,
        "bg-gray-100 ": isCommentMode,
      })}
    >
      <TourTooltipWrapper {...tourToolTipProps}>
        <div className="flex w-full">
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

export default CommentModeButton;
