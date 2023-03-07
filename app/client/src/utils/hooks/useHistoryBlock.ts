import { Location } from "history";
import { useEffect } from "react";
import history, { AppsmithLocationState } from "utils/history";

const useHistoryBlock = (
  exception?: (tx: Location<AppsmithLocationState>) => boolean,
) => {
  useEffect(() => {
    const unblock = history.block((tx) => {
      if (exception && exception(tx)) {
        return;
      }
      return false;
    });
    return unblock;
  }, []);
};

export default useHistoryBlock;
