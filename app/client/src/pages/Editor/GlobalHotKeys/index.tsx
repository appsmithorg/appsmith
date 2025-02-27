import GlobalHotKeys from "./GlobalHotKeys";
import React from "react";
import { useMouseLocation } from "./useMouseLocation";
import useDebuggerTriggerClick from "components/editorComponents/Debugger/hooks/useDebuggerTriggerClick";
import { HotkeysProvider } from "@blueprintjs/core";

//HOC to track user's mouse location, separated out so that it doesn't render the component on every mouse move
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HotKeysHOC(props: any) {
  const getMousePosition = useMouseLocation();
  const toggleDebugger = useDebuggerTriggerClick();

  return (
    <HotkeysProvider>
      <GlobalHotKeys
        {...props}
        getMousePosition={getMousePosition}
        toggleDebugger={toggleDebugger}
      >
        {props.children}
      </GlobalHotKeys>
    </HotkeysProvider>
  );
}

export default HotKeysHOC;
