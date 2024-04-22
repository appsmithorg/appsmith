import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { PADDING_FOR_HORIZONTAL_HIGHLIGHT } from "layoutSystems/anvil/utils/constants";
import React, { useMemo } from "react";
import styled from "styled-components";

const AnvilStyledHighlight = styled.div<{ zIndex: number }>`
  background-color: var(--anvil-drop-indicator);
  border-radius: 2px;
  position: absolute;
  z-index: ${(props) => props.zIndex};
  pointer-events: none;
`;

export const AnvilDnDHighlight = ({
  compensatorValues = {
    left: 0,
    top: 0,
  },
  highlightShown,
  zIndex = 0,
}: {
  compensatorValues?: {
    left: number;
    top: number;
  };
  highlightShown: AnvilHighlightInfo | null;
  zIndex?: number;
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
      left: highlightShown.posX + horizontalPadding - compensatorValues.left,
      top: highlightShown.posY + verticalPadding - compensatorValues.top,
      width: highlightShown.width - horizontalPadding * 2,
    };
  }, [highlightShown]);
  return highlightShown ? (
    <AnvilStyledHighlight style={highlightDimensionStyles} zIndex={zIndex} />
  ) : null;
};
