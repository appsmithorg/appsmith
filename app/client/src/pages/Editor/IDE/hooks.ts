import { useEffect, useState } from "react";
import { EditorState } from "entities/IDE/constants";
import { useLocation } from "react-router";
import { getCurrentAppState } from "entities/IDE/utils";

const useCurrentAppState = () => {
  const [appState, setAppState] = useState(EditorState.EDITOR);
  const { pathname } = useLocation();
  useEffect(() => {
    setAppState(getCurrentAppState(pathname));
  }, [pathname]);

  return appState;
};

export default useCurrentAppState;
