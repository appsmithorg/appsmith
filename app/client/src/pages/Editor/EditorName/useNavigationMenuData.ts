import type React from "react";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import type { noop } from "lodash";

import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";

import type { MenuItemData } from "./NavigationMenuItem";
import { MenuTypes } from "./types";
import { getExportAppAPIRoute } from "ee/constants/ApiConstants";

import {
  hasDeleteApplicationPermission,
  isPermitted,
  PERMISSION_TYPE,
} from "ee/utils/permissionHelpers";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import { Colors } from "constants/Colors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import type { ThemeProp } from "WidgetProvider/constants";
import { toast } from "@appsmith/ads";
import { DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import { getAppsmithConfigs } from "ee/configs";
import { getCurrentUser } from "selectors/usersSelectors";

const { cloudHosting, intercomAppID } = getAppsmithConfigs();

export interface NavigationMenuDataProps extends ThemeProp {
  editMode: typeof noop;
  setForkApplicationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useNavigationMenuData = ({
  editMode,
  setForkApplicationModalOpen,
}: NavigationMenuDataProps): MenuItemData[] => {
  const dispatch = useDispatch();
  const history = useHistory();

  const applicationId = useSelector(getCurrentApplicationId);
  const isApplicationIdPresent = !!(applicationId && applicationId.length > 0);
  const user = useSelector(getCurrentUser);
  const { isIntercomConsentGiven } = user || {};

  const currentApplication = useSelector(getCurrentApplication);

  const hasDeletePermission = hasDeleteApplicationPermission(
    currentApplication?.userPermissions,
  );

  const hasExportPermission = isPermitted(
    currentApplication?.userPermissions ?? [],
    PERMISSION_TYPE.EXPORT_APPLICATION,
  );
  const hasEditPermission = isPermitted(
    currentApplication?.userPermissions ?? [],
    PERMISSION_TYPE.MANAGE_APPLICATION,
  );
  const openExternalLink = (link: string) => {
    if (link) {
      window.open(link, "_blank");
    }
  };

  const exportAppAsJSON = useCallback(() => {
    const id = `t--export-app-link`;
    const existingLink = document.getElementById(id);
    existingLink && existingLink.remove();
    const link = document.createElement("a");

    const branchName = currentApplication?.gitApplicationMetadata?.branchName;
    link.href = getExportAppAPIRoute(applicationId, branchName);
    link.id = id;
    document.body.appendChild(link);
    // @ts-expect-error: Types are not available
    if (!window.Cypress) {
      link.click();
    }
    toast.show(`Successfully exported ${currentApplication?.name}`, {
      kind: "success",
    });
  }, [
    applicationId,
    currentApplication?.gitApplicationMetadata?.branchName,
    currentApplication?.name,
  ]);

  const deleteApplication = useCallback(() => {
    if (applicationId && applicationId.length > 0) {
      dispatch({
        type: ReduxActionTypes.DELETE_APPLICATION_INIT,
        payload: {
          applicationId: applicationId,
        },
      });
      history.push(APPLICATIONS_URL);
    } else {
      toast.show("Error while deleting Application", {
        kind: "error",
      });
    }
  }, [applicationId, dispatch, history]);

  return useMemo(
    () =>
      [
        {
          text: "Rename",
          onClick: editMode,
          type: MenuTypes.MENU,
          isVisible: true,
        },
        {
          text: "Fork application",
          onClick: () => setForkApplicationModalOpen(true),
          type: MenuTypes.MENU,
          isVisible: isApplicationIdPresent && hasEditPermission,
        },
        {
          text: "Export application",
          onClick: exportAppAsJSON,
          type: MenuTypes.MENU,
          isVisible: isApplicationIdPresent && hasExportPermission,
        },
        hasDeletePermission && {
          text: "Delete application",
          confirmText: "Are you sure?",
          onClick: deleteApplication,
          type: MenuTypes.RECONFIRM,
          isVisible: isApplicationIdPresent,
          style: { color: Colors.ERROR_RED },
        },
        {
          text: "divider_2",
          type: MenuTypes.MENU_DIVIDER,
          isVisible: true,
        },
        {
          text: "Help",
          type: MenuTypes.PARENT,
          isVisible: true,
          children: [
            {
              text: "Documentation",
              onClick: () => openExternalLink(DOCS_BASE_URL),
              type: MenuTypes.MENU,
              isVisible: true,
              startIcon: "book-line",
            },
            {
              text: "Report a bug",
              onClick: () =>
                openExternalLink(
                  "https://github.com/appsmithorg/appsmith/issues/new/choose",
                ),
              type: MenuTypes.MENU,
              isVisible: true,
              startIcon: "bug-line",
            },
            {
              startIcon: "chat-help",
              text: "Chat with us",
              onClick: () => {
                if (cloudHosting || isIntercomConsentGiven) {
                  window.Intercom("show");
                }
              },
              type: MenuTypes.MENU,
              isVisible: intercomAppID && window.Intercom,
            },
          ],
        },
      ].filter(Boolean) as MenuItemData[],
    [
      editMode,
      isApplicationIdPresent,
      hasEditPermission,
      exportAppAsJSON,
      hasExportPermission,
      hasDeletePermission,
      deleteApplication,
      setForkApplicationModalOpen,
      isIntercomConsentGiven,
    ],
  );
};
