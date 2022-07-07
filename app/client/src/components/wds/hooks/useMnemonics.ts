import React from "react";
import { iterateFocusableElements } from "../utils/iterate-focusable-elements";
import { useProvidedRefOrCreate } from "./useProvidedRefOrCreate";

/*
 * A mnemonic indicates to the user which key to press (single)
 * to activate a command or navigate to a component
 * typically appearing in a menu title, menu item, or the text of a button.
 */

export const useMnemonics = (
  open: boolean,
  providedRef?: React.RefObject<HTMLElement>,
) => {
  const containerRef = useProvidedRefOrCreate(providedRef);

  React.useEffect(
    function addAriaKeyshortcuts() {
      if (!open || !containerRef.current) return;
      const container = containerRef.current;

      const focusableItems = [...iterateFocusableElements(container)];

      focusableItems.map((item) => {
        // if item already has aria-keyshortcuts defined by user, skip
        if (item.getAttribute("aria-keyshortcuts")) return;

        const firstLetter = item.textContent?.toLowerCase()[0];
        if (firstLetter) item.setAttribute("aria-keyshortcuts", firstLetter);
      });
    },
    [open, containerRef],
  );

  React.useEffect(
    function handleKeyDown() {
      if (!open || !containerRef.current) return;
      const container = containerRef.current;

      const handler = (event: KeyboardEvent) => {
        // skip if a TextInput has focus
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement.tagName === "INPUT") return;

        // skip if used with modifier to preserve shortcuts like ⌘ + F
        const hasModifier = event.ctrlKey || event.altKey || event.metaKey;
        if (hasModifier) return;

        // skip if it's not a alphabet key
        if (!isAlphabetKey(event)) return;

        // if this is a typeahead event, don't propagate outside of menu
        event.stopPropagation();

        const query = event.key.toLowerCase();

        let elementToFocus: HTMLElement | undefined;

        const focusableItems = [...iterateFocusableElements(container)];

        const itemsMatchingKey = focusableItems.filter((item) => {
          const keyshortcuts = item
            .getAttribute("aria-keyshortcuts")
            ?.split(" ")
            .map((shortcut) => shortcut.toLowerCase());
          return keyshortcuts && keyshortcuts.includes(query);
        });

        const currentActiveIndex = itemsMatchingKey.indexOf(activeElement);

        // If the last element is already selected, cycle through the list
        if (currentActiveIndex === itemsMatchingKey.length - 1) {
          elementToFocus = itemsMatchingKey[0];
        } else {
          elementToFocus = itemsMatchingKey.find((item, index) => {
            return index > currentActiveIndex;
          });
        }
        elementToFocus?.focus();
      };

      container.addEventListener("keydown", handler);
      return () => container.removeEventListener("keydown", handler);
    },
    [open, containerRef],
  );

  const isAlphabetKey = (event: KeyboardEvent) => {
    return event.key.length === 1 && /[a-z\d]/i.test(event.key);
  };

  return { containerRef };
};
