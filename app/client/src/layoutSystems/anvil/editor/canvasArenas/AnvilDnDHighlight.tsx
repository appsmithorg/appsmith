import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { PADDING_FOR_HORIZONTAL_HIGHLIGHT } from "layoutSystems/anvil/utils/constants";
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
  padding = 0,
}: {
  highlightShown: AnvilHighlightInfo | null;
  padding?: number;
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
    const horizontalPadding = highlightShown.isVertical
      ? 0
      : PADDING_FOR_HORIZONTAL_HIGHLIGHT;
    const verticalPadding = highlightShown.isVertical
      ? PADDING_FOR_HORIZONTAL_HIGHLIGHT
      : 0;

    // use highlight info to calculate the dimension styles
    return {
      height: highlightShown.height - verticalPadding * 2,
      left: highlightShown.posX + horizontalPadding - padding,
      top: highlightShown.posY + verticalPadding,
      width: highlightShown.width - horizontalPadding * 2,
    };
  }, [highlightShown]);
  return highlightShown ? (
    <AnvilStyledHighlight style={highlightDimensionStyles} />
  ) : null;
};
