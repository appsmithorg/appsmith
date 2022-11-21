import { CONTAINER_GRID_PADDING } from "constants/WidgetConstants";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { CallbackHandlerEventType } from "utils/CallbackHandler/CallbackHandlerEventType";
import DynamicHeightCallbackHandler from "utils/CallbackHandler/DynamicHeightCallbackHandler";
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

export const useMaxMinPropertyPaneFieldsFocused = () => {
  const [
    isPropertyPaneMinFieldFocused,
    setPropertyPaneMinFieldFocused,
  ] = useState(false);

  const [
    isPropertyPaneMaxFieldFocused,
    setPropertyPaneMaxFieldFocused,
  ] = useState(false);

  function handleOnMaxLimitPropertyPaneFieldFocus() {
    setPropertyPaneMaxFieldFocused(true);
  }

  function handleOnMaxLimitPropertyPaneFieldBlur() {
    setPropertyPaneMaxFieldFocused(false);
  }

  function handleOnMinLimitPropertyPaneFieldFocus() {
    setPropertyPaneMinFieldFocused(true);
  }

  function handleOnMinLimitPropertyPaneFieldBlur() {
    setPropertyPaneMinFieldFocused(false);
  }

  useEffect(() => {
    DynamicHeightCallbackHandler.add(
      CallbackHandlerEventType.MAX_HEIGHT_LIMIT_FOCUS,
      handleOnMaxLimitPropertyPaneFieldFocus,
    );

    DynamicHeightCallbackHandler.add(
      CallbackHandlerEventType.MAX_HEIGHT_LIMIT_BLUR,
      handleOnMaxLimitPropertyPaneFieldBlur,
    );

    DynamicHeightCallbackHandler.add(
      CallbackHandlerEventType.MIN_HEIGHT_LIMIT_FOCUS,
      handleOnMinLimitPropertyPaneFieldFocus,
    );

    DynamicHeightCallbackHandler.add(
      CallbackHandlerEventType.MIN_HEIGHT_LIMIT_BLUR,
      handleOnMinLimitPropertyPaneFieldBlur,
    );

    return () => {
      DynamicHeightCallbackHandler.remove(
        CallbackHandlerEventType.MAX_HEIGHT_LIMIT_FOCUS,
        handleOnMaxLimitPropertyPaneFieldFocus,
      );

      DynamicHeightCallbackHandler.remove(
        CallbackHandlerEventType.MAX_HEIGHT_LIMIT_BLUR,
        handleOnMaxLimitPropertyPaneFieldBlur,
      );

      DynamicHeightCallbackHandler.remove(
        CallbackHandlerEventType.MIN_HEIGHT_LIMIT_FOCUS,
        handleOnMinLimitPropertyPaneFieldFocus,
      );

      DynamicHeightCallbackHandler.remove(
        CallbackHandlerEventType.MIN_HEIGHT_LIMIT_BLUR,
        handleOnMinLimitPropertyPaneFieldBlur,
      );
    };
  }, []);

  return {
    isPropertyPaneMaxFieldFocused,
    isPropertyPaneMinFieldFocused,
  };
};
