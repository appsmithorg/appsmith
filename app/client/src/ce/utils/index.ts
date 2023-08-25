import type { MenuItemProps } from "design-system-old";

export const addItemsInContextMenu = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  args: boolean[],
  history: any,
  workspaceId: string,
  moreActionItems: MenuItemProps[],
) => {
  return moreActionItems;
};

export const useHtmlPageTitle = () => {
  return "Appsmith";
};

export const isCEMode = () => {
  return true;
};

export const getPageTitle = (
  displayName?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  titleSuffix?: string,
) => {
  return `${displayName ? `${displayName} | ` : ""}Appsmith`;
};
