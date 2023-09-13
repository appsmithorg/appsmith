export * from "ce/utils";
import type { MenuItemProps } from "design-system-old";

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

export const getHtmlPageTitle = (instanceName: string) => {
  return instanceName ?? "Applications";
};

export const isCEMode = () => {
  return false;
};

export const getPageTitle = (
  displayName?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  titleSuffix?: string,
) => {
  return `${
    displayName
      ? `${displayName}${titleSuffix ? ` | ${titleSuffix}` : ""}`
      : titleSuffix
      ? `${titleSuffix}`
      : ""
  }`;
};

const getPrivateEmbedUrl = (url: string, method: string) => {
  const fullUrl = new URL(url);
  fullUrl.searchParams.append("ssoTrigger", method);
  return fullUrl.toString();
};

export const defaultOptionSelected = "oidc";

export function getSnippetUrl(
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPublicApp: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  method: string,
) {
  return isPublicApp ? url : getPrivateEmbedUrl(url, method);
}
