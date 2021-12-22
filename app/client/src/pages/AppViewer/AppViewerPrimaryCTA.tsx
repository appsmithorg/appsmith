import React, { useMemo } from "react";
import { useSelector } from "react-redux";

import Button from "./AppViewerButton";
import { AUTH_LOGIN_URL, getApplicationViewerPageURL } from "constants/routes";
import {
  PERMISSION_TYPE,
  isPermitted,
} from "pages/Applications/permissionHelpers";
import {
  getCurrentApplication,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { createMessage, EDIT_APP, FORK_APP, SIGN_IN } from "constants/messages";
import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import ForkApplicationModal from "pages/Applications/ForkApplicationModal";

/**
 * ---------------------------------------------------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------------------------------------------------
 */
interface Props {
  url?: string;
}

/**
 * ---------------------------------------------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------------------------------------------------
 */
const LOGIN_URL = `${AUTH_LOGIN_URL}?redirectUrl=${window.location.href}`;

function AppViewerPrimaryCTA(props: Props) {
  const { url } = props;
  const currentUser = useSelector(getCurrentUser);
  const currentPageID = useSelector(getCurrentPageId);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const currentApplication = useSelector(getCurrentApplication);
  const permissionRequired = PERMISSION_TYPE.MANAGE_APPLICATION;
  const userPermissions = currentApplication?.userPermissions ?? [];
  const canEdit = isPermitted(userPermissions, permissionRequired);

  // get the fork url
  const forkURL = useMemo(() => {
    return `${LOGIN_URL}?redirectUrl=${
      window.location.origin
    }${getApplicationViewerPageURL({
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
          className="t--back-to-editor"
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
                className="t--fork-app"
                icon="fork"
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
          className="t--sign-in"
          href={LOGIN_URL}
          text={createMessage(SIGN_IN)}
        />
      );
    }
  }, [url, canEdit]);

  return <div>{PrimaryCTA}</div>;
}

export default AppViewerPrimaryCTA;
