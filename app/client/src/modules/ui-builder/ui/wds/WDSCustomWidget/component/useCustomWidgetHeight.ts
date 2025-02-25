import { useLayoutEffect, useState } from "react";

import { COMPONENT_SIZE } from "../constants";
import { getFitPageChatHeight } from "../helpers";

export const useCustomWidgetHeight = (
  size: keyof typeof COMPONENT_SIZE = COMPONENT_SIZE.FIT_PAGE,
) => {
  const { search } = window.location;
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed") === "true";
  const [componentHeight, setComponentHeight] = useState("");

  useLayoutEffect(() => {
    const updateHeight = () => {
      const canvasElem = document.querySelector(".canvas");

      if (canvasElem) {
        switch (size) {
          case COMPONENT_SIZE.AUTO:
            setComponentHeight("100%");
            break;
          case COMPONENT_SIZE.FIT_PAGE:
            setComponentHeight(
              getFitPageChatHeight(canvasElem.clientHeight, isEmbed),
            );
            break;
          default:
            setComponentHeight(
              getFitPageChatHeight(canvasElem.clientHeight, isEmbed),
            );
            break;
        }
      }
    };

    updateHeight();

    const observer = new MutationObserver(updateHeight);

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [size, isEmbed]);

  return componentHeight;
};
