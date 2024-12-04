import { useLayoutEffect, useState } from "react";

import { COMPONENT_SIZE } from "../constants";
import { getFitPageChatHeight } from "../helpers";

export const useCustomWidgetHeight = (
  size: keyof typeof COMPONENT_SIZE = COMPONENT_SIZE.FIT_PAGE,
  isEmbed: boolean,
) => {
  const [componentHeight, setComponentHeight] = useState("");

  useLayoutEffect(() => {
    const canvasElem = document.querySelector(".canvas");

    if (canvasElem) {
      switch (size) {
        case COMPONENT_SIZE.MEDIUM:
          return setComponentHeight("600px");
        case COMPONENT_SIZE.LARGE:
          return setComponentHeight("800px");
        case COMPONENT_SIZE.FIT_PAGE:
          return setComponentHeight(
            getFitPageChatHeight(canvasElem.clientHeight, isEmbed),
          );
        default:
          return setComponentHeight(
            getFitPageChatHeight(canvasElem.clientHeight, isEmbed),
          );
      }
    }
  }, [size, isEmbed]);

  return componentHeight;
};
