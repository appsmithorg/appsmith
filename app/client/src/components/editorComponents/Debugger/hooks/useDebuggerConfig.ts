import { useMemo } from "react";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { getDebuggerPaneConfig } from "../utils/getDebuggerPaneConfig";

export const useDebuggerConfig = () => {
  const location = useLocation();
  const currentFocus = identifyEntityFromPath(location.pathname);
  const ideState = useSelector(getIDEViewMode);

  return useMemo(
    () => getDebuggerPaneConfig(currentFocus, ideState),
    [currentFocus, ideState],
  );
};
