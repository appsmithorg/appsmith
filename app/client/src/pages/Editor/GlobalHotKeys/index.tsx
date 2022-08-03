import GlobalHotKeys from "./GlobalHotKeys";
import React from "react";
import { useMouseLocation } from "./useMouseLocation";

//HOC to track user's mouse location, separated out so that it doesn't render the component on every mouse move
function HotKeysHOC(props: any) {
  const getMousePosition = useMouseLocation();

  return (
    <GlobalHotKeys {...props} getMousePosition={getMousePosition}>
      {props.children}
    </GlobalHotKeys>
  );
}

export default HotKeysHOC;
