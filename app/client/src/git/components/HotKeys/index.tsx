import { useHotKeysView } from "./useHotKeysView";
import useOps from "git/hooks/useOps";

export function useHotKeys() {
  const { toggleOpsModal } = useOps();

  return useHotKeysView({ toggleOpsModal });
}
