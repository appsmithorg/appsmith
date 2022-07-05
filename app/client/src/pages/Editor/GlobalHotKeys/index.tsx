import GlobalHotKeys from "./GlobalHotKeys";
import React from "react";
import { useMouseLocation } from "./useMouseLocation";
import { useCommentMode } from "utils/hooks/useCommentMode";

//HOC to track user's mouse location, separated out so that it doesn't render the component on every mouse move
function HotKeysHOC(props: any) {
  const getMousePosition = useMouseLocation();
  const isCommentMode = useCommentMode();

  return (
    <GlobalHotKeys
      {...props}
      getMousePosition={getMousePosition}
      isCommentMode={isCommentMode}
    >
      {props.children}
    </GlobalHotKeys>
  );
}

export default HotKeysHOC;
