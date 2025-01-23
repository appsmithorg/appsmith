import { useEffect, type RefObject } from "react";

export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T>,
  inputRef: RefObject<T>,
  callback: () => void,
) {
  useEffect(() => {
    // This function checks if the click was outside the specified ref elements and calls the callback if true.
    function handleClickOutside(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, inputRef, callback]);
}
