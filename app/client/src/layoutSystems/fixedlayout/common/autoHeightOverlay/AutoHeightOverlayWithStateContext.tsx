import React from "react";
import type { AutoHeightOverlayProps } from "./AutoHeightOverlay";
import AutoHeightOverlay from "./AutoHeightOverlay";
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
