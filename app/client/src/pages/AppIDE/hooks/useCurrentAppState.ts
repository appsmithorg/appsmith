import { useEffect, useState } from "react";
import { EditorState } from "ee/entities/IDE/constants";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";

export const useCurrentAppState = () => {
  const [appState, setAppState] = useState(EditorState.EDITOR);
  const { pathname } = useLocation();
  const entityInfo = identifyEntityFromPath(pathname);

  useEffect(() => {
    setAppState(entityInfo.appState);
  }, [entityInfo.appState]);

  return appState;
};
