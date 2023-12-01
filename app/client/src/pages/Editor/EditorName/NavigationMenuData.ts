import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import type { noop } from "lodash";

import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { APPLICATIONS_URL } from "constants/routes";

import type { MenuItemData } from "./NavigationMenuItem";
import { MenuTypes } from "./types";
import { getExportAppAPIRoute } from "@appsmith/constants/ApiConstants";

import {
  hasDeleteApplicationPermission,
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { getCurrentApplication } from "@appsmith/selectors/applicationSelectors";
import { Colors } from "constants/Colors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { redoAction, undoAction } from "actions/pageActions";
import { redoShortCut, undoShortCut } from "utils/helpers";
import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import { toast } from "design-system";
import type { ThemeProp } from "WidgetProvider/constants";
import { DISCORD_URL, DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import { protectedModeSelector } from "selectors/gitSyncSelectors";
import { useIsAppSidebarEnabled } from "../../../navigation/featureFlagHooks";

export interface NavigationMenuDataProps extends ThemeProp {
  editMode: typeof noop;
  setForkApplicationModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GetNavigationMenuData = ({
  editMode,
  setForkApplicationModalOpen,
}: NavigationMenuDataProps): MenuItemData[] => {
  const dispatch = useDispatch();
  const history = useHistory();
  const isAppSidebarEnabled = useIsAppSidebarEnabled();
  const isProtectedMode = useSelector(protectedModeSelector);

  const applicationId = useSelector(getCurrentApplicationId);

  const isApplicationIdPresent = !!(applicationId && applicationId.length > 0);

  const currentApplication = useSelector(getCurrentApplication);
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

  const exportAppAsJSON = () => {
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
  };

  const openAppSettingsPane = () => dispatch(openAppSettingsPaneAction());

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
      toast.show("Error while deleting Application", {
        kind: "error",
      });
    }
  };

  return [
    {
      text: "Back to all apps",
      onClick: () => history.replace(APPLICATIONS_URL),
      type: MenuTypes.MENU,
      isVisible: true,
    },
    {
      text: "divider_1",
      type: MenuTypes.MENU_DIVIDER,
      isVisible: true,
    },
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
    hasDeleteApplicationPermission(currentApplication?.userPermissions) && {
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
      text: "Settings",
      onClick: openAppSettingsPane,
      type: MenuTypes.MENU,
      isVisible: !isAppSidebarEnabled && !isProtectedMode,
    },
    {
      text: "Help",
      type: MenuTypes.PARENT,
      isVisible: true,
      children: [
        {
          text: "Community forum",
          onClick: () => openExternalLink("https://community.appsmith.com/"),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
        {
          text: "Discord channel",
          onClick: () => openExternalLink(DISCORD_URL),
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
          onClick: () => openExternalLink(DOCS_BASE_URL),
          type: MenuTypes.MENU,
          isVisible: true,
          isOpensNewWindow: true,
        },
      ],
    },
  ].filter(Boolean) as MenuItemData[];
};
