import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { noop } from "lodash";

import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { ThemeProp } from "components/ads/common";
import {
  setCommentModeInUrl,
  useHideComments,
} from "pages/Editor/ToggleModeButton";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { APPLICATIONS_URL, PAGE_LIST_EDITOR_URL } from "constants/routes";

import { MenuItemData, MenuTypes } from "./NavigationMenuItem";
import { useCallback } from "react";
import { ExplorerURLParams } from "../Explorer/helpers";
import { getExportAppAPIRoute } from "constants/ApiConstants";
import {
  isPermitted,
  PERMISSION_TYPE,
} from "../../Applications/permissionHelpers";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { Colors } from "constants/Colors";

type NavigationMenuDataProps = ThemeProp & {
  applicationId: string | undefined;
  editMode: typeof noop;
  deploy: typeof noop;
  currentDeployLink: string;
};

export const GetNavigationMenuData = ({
  applicationId,
  currentDeployLink,
  deploy,
  editMode,
}: NavigationMenuDataProps): MenuItemData[] => {
  const dispatch = useDispatch();
  const isHideComments = useHideComments();
  const history = useHistory();
  const params = useParams<ExplorerURLParams>();
  const currentApplication = useSelector(getCurrentApplication);
  const isApplicationIdPresent = !!(applicationId && applicationId.length > 0);
  const hasExportPermission = isPermitted(
    currentApplication?.userPermissions ?? [],
    PERMISSION_TYPE.EXPORT_APPLICATION,
  );
  const openExternalLink = useCallback((link: string) => {
    if (link) {
      window.open(link, "_blank");
    }
  }, []);

  const deleteApplication = () => {
    if (applicationId && applicationId.length > 0) {
      dispatch({
        type: ReduxActionTypes.DELETE_APPLICATION_INIT,
        payload: {
          applicationId,
        },
      });
      history.push(APPLICATIONS_URL);
    } else {
      Toaster.show({
        text: "Error while deleting Application",
        variant: Variant.danger,
      });
    }
  };

  return [
    {
      text: "Rename",
      onClick: editMode,
      type: MenuTypes.MENU,
      isVisible: true,
    },
    {
      text: "Pages",
      onClick: () => {
        history.push(PAGE_LIST_EDITOR_URL(params.applicationId, params.pageId));
      },
      type: MenuTypes.MENU,
      isVisible: true,
    },
    {
      text: "View Modes",
      type: MenuTypes.PARENT,
      isVisible: !isHideComments,
      children: [
        {
          text: "Edit Mode",
          label: "V",
          onClick: () => setCommentModeInUrl(false),
          type: MenuTypes.MENU,
          isVisible: true,
        },
        {
          text: "Comment Mode",
          label: "C",
          onClick: () => setCommentModeInUrl(true),
          type: MenuTypes.MENU,
          isVisible: true,
        },
      ],
    },
    {
      text: "Deploy",
      type: MenuTypes.PARENT,
      isVisible: true,
      children: [
        {
          text: "Deploy",
          onClick: deploy,
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
        {
          text: "Current Deployed Version",
          onClick: () => openExternalLink(currentDeployLink),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
      ],
    },
    {
      text: "Help",
      type: MenuTypes.PARENT,
      isVisible: true,
      children: [
        {
          text: "Community Forum",
          onClick: () => openExternalLink("https://community.appsmith.com/"),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
        {
          text: "Discord Channel",
          onClick: () => openExternalLink("https://discord.gg/rBTTVJp"),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
        {
          text: "Github",
          onClick: () =>
            openExternalLink("https://github.com/appsmithorg/appsmith/"),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
        {
          text: "Documentation",
          onClick: () => openExternalLink("https://docs.appsmith.com/"),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
      ],
    },
    {
      text: "Export Application",
      onClick: () =>
        applicationId && openExternalLink(getExportAppAPIRoute(applicationId)),
      type: MenuTypes.MENU,
      isVisible: isApplicationIdPresent && hasExportPermission,
    },
    {
      text: "Delete Application",
      confirmText: "Are you sure?",
      onClick: deleteApplication,
      type: MenuTypes.RECONFIRM,
      isVisible: isApplicationIdPresent,
      style: { color: Colors.ERROR_RED },
    },
  ];
};
