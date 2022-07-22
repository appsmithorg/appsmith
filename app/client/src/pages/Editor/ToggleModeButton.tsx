import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { TooltipComponent } from "design-system";
import TourTooltipWrapper from "components/ads/tour/TourTooltipWrapper";
import Pen from "remixicon-react/PencilFillIcon";
import Eye from "remixicon-react/EyeLineIcon";
import CommentIcon from "remixicon-react/MessageLineIcon";
import { Indices } from "constants/Layers";

import {
  fetchApplicationCommentsRequest,
  setCommentMode as setCommentModeAction,
} from "actions/commentActions";
import {
  commentModeSelector,
  getAppCommentThreads,
  getCommentsState,
} from "selectors/commentsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";
import { useLocation } from "react-router";
import history from "utils/history";
import { TourType } from "entities/Tour";
import useProceedToNextTourStep, {
  useIsTourStepActive,
} from "utils/hooks/useProceedToNextTourStep";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { AppState } from "reducers";
import { APP_MODE } from "entities/App";

import {
  AUTH_LOGIN_URL,
  matchBuilderPath,
  matchViewerPath,
} from "constants/routes";

import {
  commentsTourStepsEditModeTypes,
  commentsTourStepsPublishedModeTypes,
} from "comments/tour/commentsTourSteps";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppMode } from "selectors/applicationSelectors";
import { setPreviewModeAction } from "actions/editorActions";
import {
  getCurrentApplicationId,
  getIsEditorInitialized,
  previewModeSelector,
} from "selectors/editorSelectors";

import { getCurrentGitBranch } from "selectors/gitSyncSelectors";
import { isExploringSelector } from "selectors/onboardingSelectors";
import { getIsInitialized } from "selectors/appViewSelectors";
import { Toaster, Variant } from "components/ads";

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
      // Deprecating. Do not onboard more users
      // TODO Remove after deprecation of comments
      Toaster.show({
        text: "Show error here",
        variant: Variant.warning,
      });
      // AnalyticsUtil.logEvent("COMMENTS_ONBOARDING_MODAL_TRIGGERED");
      // dispatch(showCommentsIntroCarousel());
      // setCommentModeInUrl(false);
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
    dispatch(fetchApplicationCommentsRequest());
  }, [isCommentMode, currentBranch]);
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
      position="bottom"
    >
      <Pen size={20} />
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
      position="bottom"
    >
      <Eye size={20} />
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
  const commentModeClassName = showUnreadIndicator
    ? `t--toggle-comment-mode-on--unread`
    : `t--toggle-comment-mode-on`;

  return (
    <ModeButton
      active={isCommentMode}
      className={`t--switch-comment-mode-on ${commentModeClassName}`}
      onClick={handleSetCommentModeButton}
      showSelectedMode={showSelectedMode}
      type="fill"
    >
      <TooltipComponent
        content={
          <div style={{ display: "flex" }}>
            <span>
              Comment Mode
              <br />
              (Deprecating soon)
            </span>
            <span>C</span>
          </div>
        }
        hoverOpenDelay={1000}
        position="bottom"
      >
        <div className="relative">
          <CommentIcon className="w-5 h-5 text-gray-900" />
          {showUnreadIndicator && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
      </TooltipComponent>
    </ModeButton>
  );
}

export const useHideComments = () => {
  const [shouldHide, setShouldHide] = useState(true);
  const location = useLocation();
  const currentUser = useSelector(getCurrentUser);
  const isEditorInitialized = useSelector(getIsEditorInitialized);
  const isViewerInitialized = useSelector(getIsInitialized);
  useEffect(() => {
    const pathName = window.location.pathname;
    const shouldShow =
      (matchBuilderPath(pathName) && isEditorInitialized) ||
      (matchViewerPath(pathName) && isViewerInitialized);
    // Disable comment mode toggle for anonymous users
    setShouldHide(!shouldShow || currentUser?.username === ANONYMOUS_USERNAME);
  }, [location, currentUser, isEditorInitialized, isViewerInitialized]);

  return shouldHide;
};

type ToggleCommentModeButtonProps = {
  showSelectedMode?: boolean;
};

export const useHasUnreadCommentThread = (applicationId: string) => {
  const commentsState = useSelector(getCommentsState);
  return useMemo(() => {
    return !!getAppCommentThreads(
      commentsState.applicationCommentThreadsByRef[applicationId],
    ).find((tId: string) => !commentsState.commentThreadsMap[tId]?.isViewed);
  }, [commentsState]);
};

function ToggleCommentModeButton({
  showSelectedMode = true,
}: ToggleCommentModeButtonProps) {
  const dispatch = useDispatch();
  const isExploring = useSelector(isExploringSelector);
  const isCommentMode = useSelector(commentModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);
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
  const mode = useSelector((state: AppState) => state.entities.app.mode);
  const isViewMode = mode === APP_MODE.PUBLISHED;

  const handleSetCommentModeButton = useCallback(() => {
    AnalyticsUtil.logEvent("COMMENTS_TOGGLE_MODE", {
      mode: "COMMENT",
      source: "CLICK",
    });
    setCommentModeInUrl(true);
    dispatch(setPreviewModeAction(false));
    proceedToNextTourStep();
  }, [proceedToNextTourStep]);

  // Show comment mode button only on the canvas editor and viewer
  const isHideComments = useHideComments();

  const onClickPreviewModeButton = useCallback(() => {
    dispatch(setPreviewModeAction(true));
    setCommentModeInUrl(false);
  }, [dispatch, setPreviewModeAction]);

  if (isHideComments) return null;

  return (
    <Container className="t--comment-mode-switch-toggle">
      <TourTooltipWrapper {...tourToolTipProps}>
        <div style={{ display: "flex" }}>
          {!isExploring && !isViewMode && (
            <ModeButton
              active={!isCommentMode && !isPreviewMode}
              className="t--switch-comment-mode-off"
              onClick={() => {
                AnalyticsUtil.logEvent("COMMENTS_TOGGLE_MODE", {
                  mode,
                  source: "CLICK",
                });
                setCommentModeInUrl(false);
                dispatch(setPreviewModeAction(false));
              }}
              showSelectedMode={showSelectedMode}
              type="fill"
            >
              <ViewOrEditMode mode={mode} />
            </ModeButton>
          )}
          <CommentModeBtn
            handleSetCommentModeButton={handleSetCommentModeButton}
            isCommentMode={isCommentMode || isTourStepActive} // Highlight the button during the tour
            showSelectedMode={showSelectedMode}
            showUnreadIndicator={showUnreadIndicator}
          />
          {appMode === APP_MODE.EDIT && (
            <TooltipComponent
              content={
                <>
                  Preview Mode
                  <span style={{ color: "#fff", marginLeft: 20 }}>P</span>
                </>
              }
              hoverOpenDelay={1000}
              position="bottom"
            >
              <ModeButton
                active={isPreviewMode}
                className="t--switch-preview-mode-toggle"
                onClick={onClickPreviewModeButton}
                showSelectedMode={showSelectedMode}
                type="fill"
              >
                <Eye size={20} />
              </ModeButton>
            </TooltipComponent>
          )}
        </div>
      </TourTooltipWrapper>
    </Container>
  );
}

export default ToggleCommentModeButton;
