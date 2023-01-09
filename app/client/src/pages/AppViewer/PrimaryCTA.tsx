import React, { useMemo } from "react";
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
import { getAllApplications } from "actions/applicationActions";
import { viewerURL } from "RouteBuilder";
import { useHistory } from "react-router";
import { useHref } from "pages/Editor/utils";
import { NavigationSettingsColorStyle } from "constants/AppConstants";
import { Icon } from "design-system";
import { getApplicationNameTextColor } from "./utils";

/**
 * ---------------------------------------------------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------------------------------------------------
 */
type Props = {
  url?: string;
  className?: string;
  primaryColor: string;
  navColorStyle: NavigationSettingsColorStyle;
};

/**
 * ---------------------------------------------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------------------------------------------------
 */

function PrimaryCTA(props: Props) {
  const { className, navColorStyle, primaryColor, url } = props;
  const dispatch = useDispatch();
  const currentUser = useSelector(getCurrentUser);
  const currentPageID = useSelector(getCurrentPageId);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const currentApplication = useSelector(getCurrentApplication);
  const history = useHistory();
  const permissionRequired = PERMISSION_TYPE.MANAGE_APPLICATION;
  const userPermissions = currentApplication?.userPermissions ?? [];
  const canEdit = isPermitted(userPermissions, permissionRequired);

  const appViewerURL = useHref(viewerURL, {
    pageId: currentPageID,
    suffix: "fork",
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
    if (url && canEdit) {
      return (
        <Button
          borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
          className={`w-full md:w-auto ${className}`}
          navColorStyle={navColorStyle}
          onClick={() => {
            history.push(url);
          }}
          primaryColor={primaryColor}
        >
          <Icon
            fillColor={getApplicationNameTextColor(primaryColor, navColorStyle)}
            name="edit-line"
            size="extraLarge"
          />
        </Button>
      );
    }

    if (
      currentApplication?.forkingEnabled &&
      currentApplication?.isPublic &&
      currentUser?.username === ANONYMOUS_USERNAME
    ) {
      return (
        <Button
          borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
          className="t--fork-app"
          icon="fork"
          navColorStyle={navColorStyle}
          onClick={() => {
            history.push(forkURL);
          }}
          primaryColor={primaryColor}
          text={createMessage(FORK_APP)}
        />
      );
    }

    if (currentApplication?.forkingEnabled && currentApplication?.isPublic) {
      return (
        <div className="header__application-fork-btn-wrapper t--fork-btn-wrapper">
          <ForkApplicationModal
            applicationId={currentApplication?.id || ""}
            trigger={
              <Button
                borderRadius={
                  selectedTheme.properties.borderRadius.appBorderRadius
                }
                className="t--fork-app"
                icon="fork"
                navColorStyle={navColorStyle}
                onClick={() => dispatch(getAllApplications())}
                primaryColor={primaryColor}
                text={createMessage(FORK_APP)}
              />
            }
          />
        </div>
      );
    }

    if (
      currentApplication?.isPublic &&
      currentUser?.username === ANONYMOUS_USERNAME
    ) {
      return (
        <Button
          borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
          className="t--sign-in"
          isSignInButton
          navColorStyle={navColorStyle}
          onClick={() => {
            window.location.href = LOGIN_URL;
          }}
          primaryColor={primaryColor}
          text={createMessage(SIGN_IN)}
        />
      );
    }
  }, [
    url,
    canEdit,
    selectedTheme.properties.colors.primaryColor,
    selectedTheme.properties.borderRadius.appBorderRadius,
  ]);

  return <div>{PrimaryCTA}</div>;
}

export default PrimaryCTA;
