import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { getCurrentWorkflowState } from "./utils";
import { EditorState } from "entities/IDE/constants";

const useCurrentWorkflowState = () => {
  const [appState, setAppState] = useState(EditorState.EDITOR);
  const { pathname } = useLocation();
  useEffect(() => {
    setAppState(getCurrentWorkflowState(pathname));
  }, [pathname]);

  return appState;
};

export default useCurrentWorkflowState;
