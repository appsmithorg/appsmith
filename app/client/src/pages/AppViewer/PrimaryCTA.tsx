import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "./AppViewerButton";
import { AUTH_LOGIN_URL } from "constants/routes";
import {
  PERMISSION_TYPE,
  isPermitted,
} from "@appsmith/utils/permissionHelpers";
import {
  getCurrentApplication,
  getCurrentPageId,
  previewModeSelector,
} from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import {
  createMessage,
  EDIT_APP,
  FORK_APP,
  SIGN_IN,
} from "@appsmith/constants/messages";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import ForkApplicationModal from "pages/Applications/ForkApplicationModal";
import { viewerURL } from "@appsmith/RouteBuilder";
import { useHistory, useLocation } from "react-router";
import { useHref } from "pages/Editor/utils";
import type { NavigationSetting } from "constants/AppConstants";
import { Icon, Tooltip } from "design-system";
import { getApplicationNameTextColor } from "./utils";
import { ButtonVariantTypes } from "components/constants";
import { setPreviewModeInitAction } from "actions/editorActions";
import { protectedModeSelector } from "selectors/gitSyncSelectors";

/**
 * ---------------------------------------------------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------------------------------------------------
 */
interface Props {
  url?: string;
  className?: string;
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
  insideSidebar?: boolean;
  isMinimal?: boolean;
}

/**
 * ---------------------------------------------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------------------------------------------------
 */

function PrimaryCTA(props: Props) {
  const {
    className,
    insideSidebar,
    isMinimal,
    navColorStyle,
    primaryColor,
    url,
  } = props;
  const currentUser = useSelector(getCurrentUser);
  const currentPageID = useSelector(getCurrentPageId);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const currentApplication = useSelector(getCurrentApplication);
  const history = useHistory();
  const permissionRequired = PERMISSION_TYPE.MANAGE_APPLICATION;
  const userPermissions = currentApplication?.userPermissions ?? [];
  const canEdit = isPermitted(userPermissions, permissionRequired);
  const [isForkModalOpen, setIsForkModalOpen] = useState(false);
  const isPreviewMode = useSelector(previewModeSelector);
  const isProtectedMode = useSelector(protectedModeSelector);
  const dispatch = useDispatch();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  useEffect(() => {
    if (queryParams.get("fork") === "true") {
      handleForkModalOpen();
    } else {
      handleForkModalClose();
    }
  }, []);

  const appendOrDeleteForkParam = (appendOrDelete: "append" | "delete") => {
    const url = new URL(window.location.href);

    if (appendOrDelete === "append" && !url.searchParams.has("fork")) {
      url.searchParams.append("fork", "true");
      history.push(url.toString().slice(url.origin.length));
    } else if (appendOrDelete === "delete" && url.searchParams.has("fork")) {
      url.searchParams.delete("fork");
      history.push(url.toString().slice(url.origin.length));
    }
  };

  const handleForkModalOpen = () => {
    setIsForkModalOpen(true);
    appendOrDeleteForkParam("append");
  };

  const handleForkModalClose = () => {
    setIsForkModalOpen(false);
    appendOrDeleteForkParam("delete");
  };

  useEffect(() => {
    // delete "fork" param from url if user is not logged in
    if (
      currentApplication?.forkingEnabled &&
      currentUser?.username === ANONYMOUS_USERNAME
    ) {
      appendOrDeleteForkParam("delete");
    }
  }, [currentApplication?.forkingEnabled, currentUser?.username]);

  const appViewerURL = useHref(viewerURL, {
    pageId: currentPageID,
    params: {
      fork: "true",
      branch: null,
    },
  });

  // get the fork url
  const forkURL = useMemo(() => {
    const encodedForkRedirectURL = `${encodeURIComponent(
      `${window.location.origin}${appViewerURL}`,
    )}`;
    return `${AUTH_LOGIN_URL}?redirectUrl=${encodedForkRedirectURL}`;
  }, [appViewerURL]);

  const LOGIN_URL = `${AUTH_LOGIN_URL}?redirectUrl=${encodeURIComponent(
    window.location.href,
  )}`;

  /**
   * returns the cta to be used based on user login status
   *
   *
   * 1. if user can edit the app -> the back to edit app button
   * 2. if forking app is enabled and app is public but the user is not logged  -> fork button
   */
  const PrimaryCTA = useMemo(() => {
    if (url && canEdit && !isProtectedMode) {
      return (
        <Tooltip
          content={createMessage(EDIT_APP)}
          isDisabled={insideSidebar}
          placement="bottom"
        >
          <Button
            borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
            className={className}
            icon={
              <Icon
                color={getApplicationNameTextColor(primaryColor, navColorStyle)}
                name="pencil-line"
                size="md"
              />
            }
            insideSidebar={insideSidebar}
            isMinimal={isMinimal}
            navColorStyle={navColorStyle}
            onClick={() => {
              if (isPreviewMode) {
                dispatch(setPreviewModeInitAction(!isPreviewMode));
              } else {
                history.push(url);
              }
            }}
            primaryColor={primaryColor}
            text={insideSidebar && !isMinimal && createMessage(EDIT_APP)}
          />
        </Tooltip>
      );
    }
    // We wait for the url to be available here to avoid showing the fork
    // button for a moment and then showing the edit button i.e show one of the buttons once
    // the data is available
    if (!currentUser || !url) return;
    if (
      currentApplication?.forkingEnabled &&
      currentUser?.username === ANONYMOUS_USERNAME
    ) {
      return (
        <Button
          borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
          buttonColor={selectedTheme.properties.colors.primaryColor}
          buttonVariant="PRIMARY"
          className={`t--fork-app w-full md:w-auto ${className}`}
          icon="fork"
          insideSidebar={insideSidebar}
          navColorStyle={navColorStyle}
          onClick={() => {
            history.push(forkURL);
          }}
          primaryColor={primaryColor}
          text={createMessage(FORK_APP)}
          varient={ButtonVariantTypes.SECONDARY}
        />
      );
    }

    if (currentApplication?.forkingEnabled) {
      return (
        <div className="header__application-fork-btn-wrapper t--fork-btn-wrapper">
          <Button
            borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
            buttonColor={selectedTheme.properties.colors.primaryColor}
            buttonVariant="PRIMARY"
            className={`t--fork-app w-full md:w-auto ${className}`}
            data-testid="fork-modal-trigger"
            icon="fork"
            insideSidebar={insideSidebar}
            navColorStyle={navColorStyle}
            onClick={() => {
              handleForkModalOpen();
            }}
            primaryColor={primaryColor}
            text={createMessage(FORK_APP)}
            varient={ButtonVariantTypes.SECONDARY}
          />
          <ForkApplicationModal
            applicationId={currentApplication?.id || ""}
            handleClose={handleForkModalClose}
            handleOpen={handleForkModalOpen}
            isModalOpen={isForkModalOpen}
          />
        </div>
      );
    }

    if (
      currentApplication?.isPublic &&
      currentUser?.username === ANONYMOUS_USERNAME &&
      /**
       * Since the Backend doesn't have navigationSetting field by default
       * and we are creating the default values only when any nav settings via the
       * settings pane has changed, we need to hide the sign in button ONLY when the
       * showSignIn setting is explicitly set to false by the user via the settings pane.
       */
      currentApplication?.applicationDetail?.navigationSetting?.showSignIn !==
        false
    ) {
      return (
        <Button
          borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
          className="t--sign-in"
          insideSidebar={insideSidebar}
          navColorStyle={navColorStyle}
          onClick={() => {
            window.location.href = LOGIN_URL;
          }}
          primaryColor={primaryColor}
          text={createMessage(SIGN_IN)}
          varient={ButtonVariantTypes.SECONDARY}
        />
      );
    }
  }, [
    url,
    canEdit,
    forkURL,
    currentUser?.username,
    selectedTheme.properties.colors.primaryColor,
    selectedTheme.properties.borderRadius.appBorderRadius,
    navColorStyle,
    primaryColor,
    isForkModalOpen,
  ]);

  return <div>{PrimaryCTA}</div>;
}

export default PrimaryCTA;
