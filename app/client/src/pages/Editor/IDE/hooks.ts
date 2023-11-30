import { useEffect, useState } from "react";
import { AppState } from "entities/IDE/constants";
import { useLocation } from "react-router";
import { getCurrentAppState } from "entities/IDE/utils";

const useCurrentAppState = () => {
  const [appState, setAppState] = useState(AppState.EDITOR);
  const { pathname } = useLocation();
  useEffect(() => {
    setAppState(getCurrentAppState(pathname));
  }, [pathname]);

  return appState;
};

export default useCurrentAppState;
