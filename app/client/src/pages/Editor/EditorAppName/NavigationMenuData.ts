import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { noop } from "lodash";

import { Variant } from "components/ads/common";
import { Toaster } from "components/ads/Toast";
import { ThemeProp } from "components/ads/common";
import { setCommentModeInUrl } from "pages/Editor/ToggleModeButton";
import { areCommentsEnabledForUserAndApp } from "selectors/commentsSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";

import { MenuItemData, MenuTypes } from "./NavigationMenuItem";
import { useCallback } from "react";

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
  const commentsEnabled = useSelector(areCommentsEnabledForUserAndApp);
  const history = useHistory();

  const isApplicationIdPresent = !!(applicationId && applicationId.length > 0);

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
      text: "View Modes",
      type: MenuTypes.PARENT,
      isVisible: !!commentsEnabled,
      children: [
        {
          text: "Edit Mode",
          label: "E",
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
          onClick: () => openExternalLink("https://discord.gg/9deFW7q4kB"),
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
      text: "Delete Application",
      confirmText: "Are you sure?",
      onClick: deleteApplication,
      type: MenuTypes.RECONFIRM,
      isVisible: isApplicationIdPresent,
    },
  ];
};
