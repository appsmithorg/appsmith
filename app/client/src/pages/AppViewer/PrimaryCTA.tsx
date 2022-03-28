import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import Button from "./AppViewerButton";
import { AUTH_LOGIN_URL } from "constants/routes";
import {
  PERMISSION_TYPE,
  isPermitted,
} from "pages/Applications/permissionHelpers";
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

/**
 * ---------------------------------------------------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------------------------------------------------
 */
type Props = {
  url?: string;
  className?: string;
};

/**
 * ---------------------------------------------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------------------------------------------------
 */
const LOGIN_URL = `${AUTH_LOGIN_URL}?redirectUrl=${window.location.href}`;

function PrimaryCTA(props: Props) {
  const { className, url } = props;
  const dispatch = useDispatch();
  const currentUser = useSelector(getCurrentUser);
  const currentPageID = useSelector(getCurrentPageId);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const currentApplication = useSelector(getCurrentApplication);
  const permissionRequired = PERMISSION_TYPE.MANAGE_APPLICATION;
  const userPermissions = currentApplication?.userPermissions ?? [];
  const canEdit = isPermitted(userPermissions, permissionRequired);

  // get the fork url
  const forkURL = useMemo(() => {
    return `${LOGIN_URL}?redirectUrl=${window.location.origin}${viewerURL({
      applicationId: currentApplication?.applicationId,
      pageId: currentPageID,
      suffix: "fork",
    })}`;
  }, [currentApplication?.applicationId, currentPageID]);

  /**
   * returns the cta to be used based on user login status
   *
   * 1. if user can edit the app -> the back to edit app button
   * 2. if forking app is enabled and app is public but the user is not logged  -> fork button
   */
  const PrimaryCTA = useMemo(() => {
    if (url && canEdit) {
      return (
        <Button
          borderRadius={selectedTheme.properties.borderRadius.appBorderRadius}
          buttonColor={selectedTheme.properties.colors.primaryColor}
          buttonVariant="PRIMARY"
          className={`w-full md:w-auto ${className}`}
          onClick={() => {
            window.location.href = url;
          }}
          text={createMessage(EDIT_APP)}
        />
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
          buttonColor={selectedTheme.properties.colors.primaryColor}
          buttonVariant="PRIMARY"
          className="t--fork-app"
          icon="fork"
          onClick={() => {
            window.location.href = forkURL;
          }}
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
                buttonColor={selectedTheme.properties.colors.primaryColor}
                buttonVariant="PRIMARY"
                className="t--fork-app"
                icon="fork"
                onClick={() => dispatch(getAllApplications())}
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
          buttonColor={selectedTheme.properties.colors.primaryColor}
          buttonVariant="PRIMARY"
          className="t--sign-in"
          onClick={() => {
            window.location.href = LOGIN_URL;
          }}
          text={createMessage(SIGN_IN)}
        />
      );
    }
  }, [url, canEdit]);

  return <div>{PrimaryCTA}</div>;
}

export default PrimaryCTA;
