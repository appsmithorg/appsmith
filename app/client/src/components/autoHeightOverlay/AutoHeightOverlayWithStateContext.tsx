import React from "react";
import AutoHeightOverlay, { AutoHeightOverlayProps } from "./AutoHeightOverlay";
import { AutoHeightLimitsStateContextProvider } from "./store";

function AutoHeightOverlayWithStateContext(props: AutoHeightOverlayProps) {
  return (
    <AutoHeightLimitsStateContextProvider
      maxDynamicHeight={props.maxDynamicHeight}
      minDynamicHeight={props.minDynamicHeight}
    >
      <AutoHeightOverlay {...props} />
    </AutoHeightLimitsStateContextProvider>
  );
}

export default AutoHeightOverlayWithStateContext;
