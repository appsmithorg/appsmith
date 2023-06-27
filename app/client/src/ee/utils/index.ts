export * from "ce/utils";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import type { MenuItemProps } from "design-system-old";
import { useSelector } from "react-redux";

export const openInNewTab = (url: string) => {
  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (newWindow) newWindow.opener = null;
};

export const addItemsInContextMenu = (
  args: boolean[],
  history: any,
  workspaceId: string,
  moreActionItems: MenuItemProps[],
) => {
  const updatedActionItems = moreActionItems;
  if (args.every(Boolean)) {
    updatedActionItems.push({
      onSelect: () =>
        history.push(`/workspace/${workspaceId}/settings/members`),
      children: "Members",
      key: "members",
      startIcon: "member",
      "data-testid": "t--app-members",
    });
  }
  return updatedActionItems;
};

export const useHtmlPageTitle = () => {
  const tentantConfig = useSelector(getTenantConfig);
  const { instanceName } = tentantConfig;

  return instanceName ?? "Applications";
};
