import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { noop } from "lodash";

import { Toaster, Variant } from "design-system";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";

import { MenuItemData, MenuTypes } from "./NavigationMenuItem";
import { useCallback } from "react";
import { ExplorerURLParams } from "../Explorer/helpers";
import { getExportAppAPIRoute } from "@appsmith/constants/ApiConstants";

import {
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { Colors } from "constants/Colors";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import { getIsGitConnected } from "selectors/gitSyncSelectors";
import {
  createMessage,
  DEPLOY_MENU_OPTION,
  CONNECT_TO_GIT_OPTION,
  CURRENT_DEPLOY_PREVIEW_OPTION,
} from "@appsmith/constants/messages";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { redoAction, undoAction } from "actions/pageActions";
import { redoShortCut, undoShortCut } from "utils/helpers";
import { pageListEditorURL } from "RouteBuilder";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ThemeProp } from "widgets/constants";

type NavigationMenuDataProps = ThemeProp & {
  editMode: typeof noop;
  deploy: typeof noop;
  currentDeployLink: string;
};

export const GetNavigationMenuData = ({
  currentDeployLink,
  deploy,
  editMode,
}: NavigationMenuDataProps): MenuItemData[] => {
  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams<ExplorerURLParams>();

  const isGitConnected = useSelector(getIsGitConnected);

  const openGitConnectionPopup = () => {
    AnalyticsUtil.logEvent("GS_CONNECT_GIT_CLICK", {
      source: "Application name menu (top left)",
    });

    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.GIT_CONNECTION,
      }),
    );
  };

  const applicationId = useSelector(getCurrentApplicationId);

  const isApplicationIdPresent = !!(applicationId && applicationId.length > 0);

  const currentApplication = useSelector(getCurrentApplication);
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
          applicationId: applicationId,
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

  const deployOptions = [
    {
      text: createMessage(DEPLOY_MENU_OPTION),
      onClick: deploy,
      type: MenuTypes.MENU,
      isVisible: true,
      isOpensNewWindow: true,
      className: "t--app-name-menu-deploy",
    },
    {
      text: createMessage(CURRENT_DEPLOY_PREVIEW_OPTION),
      onClick: () => openExternalLink(currentDeployLink),
      type: MenuTypes.MENU,
      isVisible: true,
      isOpensNewWindow: true,
      className: "t--app-name-menu-deploy-current-version",
    },
  ];

  if (!isGitConnected) {
    deployOptions.push({
      text: createMessage(CONNECT_TO_GIT_OPTION),
      onClick: () => openGitConnectionPopup(),
      type: MenuTypes.MENU,
      isVisible: true,
      isOpensNewWindow: false,
      className: "t--app-name-menu-deploy-connect-to-git",
    });
  }

  return [
    {
      text: "Edit Name",
      onClick: editMode,
      type: MenuTypes.MENU,
      isVisible: true,
    },
    {
      text: "Edit",
      type: MenuTypes.PARENT,
      isVisible: true,
      children: [
        {
          text: "Undo",
          labelElement: undoShortCut(),
          onClick: () => dispatch(undoAction()),
          type: MenuTypes.MENU,
          isVisible: true,
        },
        {
          text: "Redo",
          labelElement: redoShortCut(),
          onClick: () => dispatch(redoAction()),
          type: MenuTypes.MENU,
          isVisible: true,
        },
      ],
    },
    {
      text: "Pages",
      onClick: () => {
        history.push(pageListEditorURL({ pageId: params.pageId }));
      },
      type: MenuTypes.MENU,
      isVisible: true,
    },
    {
      text: "Deploy",
      type: MenuTypes.PARENT,
      isVisible: true,
      children: deployOptions,
      className: "t--app-name-menu-deploy-parent",
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
