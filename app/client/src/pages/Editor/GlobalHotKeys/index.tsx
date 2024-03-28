import GlobalHotKeys from "./GlobalHotKeys";
import React from "react";
import { useMouseLocation } from "./useMouseLocation";
import useDebuggerTriggerClick from "components/editorComponents/Debugger/hooks/useDebuggerTriggerClick";

//HOC to track user's mouse location, separated out so that it doesn't render the component on every mouse move
function HotKeysHOC(props: any) {
  const getMousePosition = useMouseLocation();
  const toggleDebugger = useDebuggerTriggerClick();

  return (
    <GlobalHotKeys
      {...props}
      getMousePosition={getMousePosition}
      toggleDebugger={toggleDebugger}
    >
      {props.children}
    </GlobalHotKeys>
  );
}

export default HotKeysHOC;
