import type React from "react";
import { useEffect, useRef, useState } from "react";

import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { EVENTS } from "../component/customWidgetscript";
import type { CustomComponentProps } from "../component";
import type { IframeMessenger } from "../services/IframeMessenger";

export const useIframeMessageHandler = (
  props: CustomComponentProps,
  iframe: React.RefObject<HTMLIFrameElement>,
) => {
  const { model, onConsole, onTriggerEvent, onUpdateModel, renderMode } = props;
  const messenger = useRef<IframeMessenger | null>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);

  u;

  return { isIframeReady };
};
