import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import type { noop } from "lodash";
import { APPLICATIONS_URL } from "constants/routes";
import type { MenuItemData } from "pages/Editor/EditorName/NavigationMenuItem";
import { MenuTypes } from "pages/Editor/EditorName/types";
import { hasDeletePackagePermission } from "@appsmith/utils/permissionHelpers";
import { Colors } from "constants/Colors";
import { toast } from "design-system";
import type { ThemeProp } from "WidgetProvider/constants";
import { DISCORD_URL, DOCS_BASE_URL } from "constants/ThirdPartyConstants";
import { getCurrentPackage } from "@appsmith/selectors/packageSelectors";
import { deletePackage } from "@appsmith/actions/packageActions";
import {
  createMessage,
  ERROR_DELETING_PACKAGE,
} from "@appsmith/constants/messages";

type NavigationMenuDataProps = ThemeProp & {
  editMode: typeof noop;
};

/*
  This is written as a component because we cannot take out onDeletePackage and openExternalLink.
  If we do that, we need to pass them as props to the EditorName component so that we can re-use EditorName component.
*/
export const GetNavigationMenuData = ({
  editMode,
}: NavigationMenuDataProps): MenuItemData[] => {
  const dispatch = useDispatch();
  const history = useHistory();
  const currentPackage = useSelector(getCurrentPackage);
  const packageId = currentPackage?.id;

  const isPkgIdPresent = !!(packageId && packageId.length > 0);

  const openExternalLink = (link: string) => {
    if (link) {
      window.open(link, "_blank");
    }
  };

  const onDeletePackage = () => {
    if (isPkgIdPresent) {
      dispatch(deletePackage({ id: packageId }));
      history.push(APPLICATIONS_URL);
    } else {
      toast.show(createMessage(ERROR_DELETING_PACKAGE), {
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
    hasDeletePackagePermission(currentPackage?.userPermissions) && {
      text: "Delete package",
      confirmText: "Are you sure?",
      onClick: onDeletePackage,
      type: MenuTypes.RECONFIRM,
      isVisible: isPkgIdPresent,
      style: { color: Colors.ERROR_RED },
    },
  ].filter(Boolean) as MenuItemData[];
};
