import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import React, { useMemo } from "react";
import styled from "styled-components";

const AnvilStyledHighlight = styled.div`
  background-color: var(--anvil-drop-indicator);
  border-radius: 2px;
  position: absolute;
  z-index: 10000;
  pointer-events: none;
`;

export const AnvilDnDHighlight = ({
  highlightShown,
}: {
  highlightShown: AnvilHighlightInfo | null;
}) => {
  const highlightDimensionStyles = useMemo(() => {
    if (!highlightShown) {
      return {
        height: 0,
        left: 0,
        top: 0,
        width: 0,
      };
    }
    // use highlight info to calculate the dimension styles
    return {
      height: highlightShown.height,
      left: highlightShown.posX,
      top: highlightShown.posY,
      width: highlightShown.width,
    };
  }, [highlightShown]);
  return highlightShown ? (
    <AnvilStyledHighlight style={highlightDimensionStyles} />
  ) : null;
};
