import { GlobeIcon } from "pages/Editor/Explorer/ExplorerIcons";
import type { GetGroupHookType } from "../types";

export const useGetGlobalItemsForStateInspector: GetGroupHookType = () => {
  const appsmithObj = {
    key: "appsmith",
    title: "appsmith",
    icon: GlobeIcon(),
  };

  const appsmithItems = [
    {
      id: appsmithObj.key,
      startIcon: appsmithObj.icon,
      title: appsmithObj.title,
    },
  ];

  return { group: "Globals", items: appsmithItems };
};
