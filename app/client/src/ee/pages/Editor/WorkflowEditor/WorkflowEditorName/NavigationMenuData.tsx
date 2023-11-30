import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import type { noop } from "lodash";
import { APPLICATIONS_URL } from "constants/routes";

// import { getExportAppAPIRoute } from "@appsmith/constants/ApiConstants";

import {
  hasDeleteWorkflowPermission,
  isPermitted,
  PERMISSION_TYPE,
} from "@appsmith/utils/permissionHelpers";
import { Colors } from "constants/Colors";
import { redoAction, undoAction } from "actions/pageActions";
import { redoShortCut, undoShortCut } from "utils/helpers";
import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import { toast } from "design-system";
import type { ThemeProp } from "WidgetProvider/constants";
import { DISCORD_URL, DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import type { MenuItemData } from "pages/Editor/EditorName/NavigationMenuItem";
import { MenuTypes } from "pages/Editor/EditorName/types";
import {
  getCurrentWorkflow,
  getCurrentWorkflowId,
} from "@appsmith/selectors/workflowSelectors";
import { deleteWorkflow } from "@appsmith/actions/workflowActions";

export interface NavigationMenuDataProps extends ThemeProp {
  editMode: typeof noop;
}

// TODO (Workflows): Some of the menu items are not implemented yet. Will be implemented as API's are ready.
export const GetNavigationMenuData = ({
  editMode,
}: NavigationMenuDataProps): MenuItemData[] => {
  const dispatch = useDispatch();
  const history = useHistory();
  const isAppSidebarEnabled = useFeatureFlag(
    FEATURE_FLAG.release_app_sidebar_enabled,
  );

  const workflowId = useSelector(getCurrentWorkflowId);

  const isworkflowIdPresent = !!(workflowId && workflowId.length > 0);

  const currentWorkflow = useSelector(getCurrentWorkflow);
  const hasExportPermission = isPermitted(
    currentWorkflow?.userPermissions ?? [],
    PERMISSION_TYPE.EXPORT_WORKFLOWS,
  );
  const hasEditPermission = isPermitted(
    currentWorkflow?.userPermissions ?? [],
    PERMISSION_TYPE.MANAGE_WORKFLOWS,
  );
  const openExternalLink = (link: string) => {
    if (link) {
      window.open(link, "_blank");
    }
  };

  const exportAppAsJSON = () => {
    // const id = `t--export-app-link`;
    // const existingLink = document.getElementById(id);
    // existingLink && existingLink.remove();
    // const link = document.createElement("a");
    // const branchName = currentWorkflow?.gitApplicationMetadata?.branchName;
    // link.href = getExportAppAPIRoute(workflowId, branchName);
    // link.id = id;
    // document.body.appendChild(link);
    // // @ts-expect-error: Types are not available
    // if (!window.Cypress) {
    //   link.click();
    // }
    // toast.show(`Successfully exported ${currentWorkflow?.name}`, {
    //   kind: "success",
    // });
  };

  const openAppSettingsPane = () => dispatch(openAppSettingsPaneAction());

  const deleteWorkflowHandler = () => {
    if (workflowId && workflowId.length > 0) {
      dispatch(deleteWorkflow({ id: workflowId }));
      history.push(APPLICATIONS_URL);
    } else {
      toast.show("Error while deleting Workflow", {
        kind: "error",
      });
    }
  };

  return [
    {
      text: "Home",
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
      text: "Edit name",
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
      text: "Settings",
      onClick: openAppSettingsPane,
      type: MenuTypes.MENU,
      isVisible: !isAppSidebarEnabled,
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
    {
      text: "Fork workflow",
      onClick: () => {},
      type: MenuTypes.MENU,
      isVisible: isworkflowIdPresent && hasEditPermission,
    },
    {
      text: "Export workflow",
      onClick: exportAppAsJSON,
      type: MenuTypes.MENU,
      isVisible: isworkflowIdPresent && hasExportPermission,
    },
    hasDeleteWorkflowPermission(currentWorkflow?.userPermissions) && {
      text: "Delete workflow",
      confirmText: "Are you sure?",
      onClick: deleteWorkflowHandler,
      type: MenuTypes.RECONFIRM,
      isVisible: isworkflowIdPresent,
      style: { color: Colors.ERROR_RED },
    },
  ].filter(Boolean) as MenuItemData[];
};
