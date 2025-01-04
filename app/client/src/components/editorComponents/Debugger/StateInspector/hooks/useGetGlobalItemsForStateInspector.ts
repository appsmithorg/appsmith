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
      title: appsmithObj.title,
      startIcon: appsmithObj.icon,
    },
  ];

  return { group: "Globals", items: appsmithItems };
};
