import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { getCurrentPackageState } from "./utils";
import { EditorState } from "@appsmith/entities/IDE/constants";

const useCurrentPackageState = () => {
  const [appState, setAppState] = useState(EditorState.EDITOR);
  const { pathname } = useLocation();
  useEffect(() => {
    setAppState(getCurrentPackageState(pathname));
  }, [pathname]);

  return appState;
};

export default useCurrentPackageState;
