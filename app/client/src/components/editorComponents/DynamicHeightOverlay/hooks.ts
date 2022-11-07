import { CONTAINER_GRID_PADDING } from "constants/WidgetConstants";
import { CSSProperties, useMemo, useState } from "react";
import { onMouseHoverCallbacksProps } from "./types";

type UseHoverStateReturnType = [boolean, onMouseHoverCallbacksProps];

export function useHoverState(): UseHoverStateReturnType {
  const [isActive, setIsActive] = useState(false);

  function handleMouseEnter(state: boolean) {
    setIsActive(state);
  }

  return [
    isActive,
    {
      onMouseEnter: () => handleMouseEnter(true),
      onMouseLeave: () => handleMouseEnter(false),
    },
  ];
}

interface UsePositionedStylesProps {
  bottomRow: number;
  leftColumn: number;
  noContainerOffset?: boolean;
  parentColumnSpace: number;
  parentRowSpace: number;
  rightColumn: number;
  topRow: number;
}

export const usePositionedStyles = ({
  bottomRow,
  leftColumn,
  noContainerOffset,
  parentColumnSpace,
  parentRowSpace,
  rightColumn,
  topRow,
}: UsePositionedStylesProps) => {
  const styles: CSSProperties = useMemo(
    () => ({
      height: (bottomRow - topRow) * parentRowSpace,
      width: (rightColumn - leftColumn) * parentColumnSpace,
      left:
        leftColumn * parentColumnSpace +
        (noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
      top:
        topRow * parentRowSpace +
        (noContainerOffset ? 0 : CONTAINER_GRID_PADDING),
    }),
    [
      bottomRow,
      leftColumn,
      noContainerOffset,
      parentColumnSpace,
      parentRowSpace,
      rightColumn,
      topRow,
    ],
  );

  return styles;
};
