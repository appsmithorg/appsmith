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
    const canvasElem = document.querySelector(".canvas");

    if (!canvasElem) return;

    const updateHeight = () => {
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
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(canvasElem);

    return () => resizeObserver.disconnect();
  }, [size, isEmbed]);

  return componentHeight;
};
