import { useState } from "react";
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
