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
import { getDefaultApplicationId } from "selectors/applicationSelectors";

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
  const isHideComments = useHideComments();
  const history = useHistory();
  const params = useParams<ExplorerURLParams>();

  const defaultApplicationId = useSelector(getDefaultApplicationId);

  const isApplicationIdPresent = !!(
    defaultApplicationId && defaultApplicationId.length > 0
  );

  const openExternalLink = useCallback((link: string) => {
    if (link) {
      window.open(link, "_blank");
    }
  }, []);

  const deleteApplication = () => {
    if (defaultApplicationId && defaultApplicationId.length > 0) {
      dispatch({
        type: ReduxActionTypes.DELETE_APPLICATION_INIT,
        payload: {
          applicationId: defaultApplicationId,
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
        history.push(PAGE_LIST_EDITOR_URL(defaultApplicationId, params.pageId));
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
        defaultApplicationId &&
        openExternalLink(getExportAppAPIRoute(defaultApplicationId)),
      type: MenuTypes.MENU,
      isVisible: isApplicationIdPresent,
    },
    {
      text: "Delete Application",
      confirmText: "Are you sure?",
      onClick: deleteApplication,
      type: MenuTypes.RECONFIRM,
      isVisible: isApplicationIdPresent,
    },
  ];
};
