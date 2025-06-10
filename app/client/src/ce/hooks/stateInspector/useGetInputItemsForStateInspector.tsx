import type { GetGroupHookType } from "components/editorComponents/Debugger/StateInspector/types";

export const useGetInputItemsForStateInspector: GetGroupHookType = () => {
  return { group: "Inputs", items: [] };
};
