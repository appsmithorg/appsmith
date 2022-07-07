import React from "react";
import { useProvidedRefOrCreate } from "./useProvidedRefOrCreate";
import { iterateFocusableElements } from "../utils/iterate-focusable-elements";

type Gesture = "anchor-click" | "anchor-key-press";
type Callback = (
  gesture: Gesture,
  event?: React.KeyboardEvent<HTMLElement>,
) => unknown;

export const useMenuInitialFocus = (
  open: boolean,
  onOpen?: Callback,
  providedRef?: React.RefObject<HTMLElement>,
) => {
  const containerRef = useProvidedRefOrCreate(providedRef);
  const [openingKey, setOpeningKey] = React.useState<string | undefined>(
    undefined,
  );

  const openWithFocus: Callback = (gesture, event) => {
    if (gesture === "anchor-key-press" && event) setOpeningKey(event.code);
    else setOpeningKey(undefined);
    if (typeof onOpen === "function") onOpen(gesture, event);
  };

  /**
   * Pick the first element to focus based on the key used to open the Menu
   * ArrowDown | Space | Enter: first element
   * ArrowUp: last element
   */
  React.useEffect(() => {
    if (!open) return;
    if (!openingKey || !containerRef.current) return;

    const iterable = iterateFocusableElements(containerRef.current);
    if (["ArrowDown", "Space", "Enter"].includes(openingKey)) {
      const firstElement = iterable.next().value;
      /** We push imperative focus to the next tick to prevent React's batching */
      setTimeout(() => firstElement?.focus());
    } else if (["ArrowUp"].includes(openingKey)) {
      const elements = [...iterable];
      const lastElement = elements[elements.length - 1];
      setTimeout(() => lastElement.focus());
    }
  }, [open, openingKey, containerRef]);

  return { containerRef, openWithFocus };
};
