import { Location } from "history";
import { useEffect } from "react";
import history, { AppsmithLocationState } from "utils/history";

const useHistoryBlock = (
  exception?: (tx: Location<AppsmithLocationState>) => boolean,
) => {
  useEffect(() => {
    const unblock = history.block((tx) => {
      if (exception && exception(tx)) {
        // proceeds with navigation
        return;
      }
      // prevents navigation
      return false;
    });
    // unblocks history on component unmount
    return unblock;
  }, []);
};

export default useHistoryBlock;
