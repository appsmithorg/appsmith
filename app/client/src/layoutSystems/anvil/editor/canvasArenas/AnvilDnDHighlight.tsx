import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { PADDING_FOR_HORIZONTAL_HIGHLIGHT } from "layoutSystems/anvil/utils/constants";
import React, { useMemo } from "react";
import styled from "styled-components";

// Styled component for the highlight element
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
  // Memoized calculation of highlight dimensions styles
  const highlightDimensionStyles = useMemo(() => {
    if (!highlightShown) {
      // If no highlight info is provided, return default dimensions
      return {
        height: 0,
        left: 0,
        top: 0,
        width: 0,
      };
    }

    // Calculate padding based on highlight orientation
    const verticalPadding = highlightShown.isVertical
      ? PADDING_FOR_HORIZONTAL_HIGHLIGHT
      : 0;

    // Reduce highlight width for empty canvas by compensator values.
    const width =
      highlightShown.canvasId === "0"
        ? highlightShown.width + compensatorValues.left * 2
        : highlightShown.width;

    // Calculate dimension styles based on highlight info
    return {
      height: highlightShown.height - verticalPadding * 2,
      left: highlightShown.posX - compensatorValues.left,
      top: highlightShown.posY + verticalPadding - compensatorValues.top,
      width: width,
    };
  }, [highlightShown]);

  // Render the highlight element if highlight info is provided
  return highlightShown ? (
    <AnvilStyledHighlight
      data-type="anvil-dnd-highlight"
      style={highlightDimensionStyles}
      zIndex={zIndex}
    />
  ) : null; // Otherwise, return null
};
