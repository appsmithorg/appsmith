import GlobalHotKeys from "./GlobalHotKeys";
import React from "react";
import { useMouseLocation } from "./useMouseLocation";

function HotKeysHOC(props: any) {
  const getMousePosition = useMouseLocation();

  return (
    <GlobalHotKeys {...props} getMousePosition={getMousePosition}>
      {props.children}
    </GlobalHotKeys>
  );
}

export default HotKeysHOC;
