import { createFocusManager } from "@react-aria/focus";
import type { ListState } from "@react-stately/list";
import { useCallback, type RefObject, useMemo } from "react";
import type { DOMAttributes, FocusableElement } from "@react-types/shared";

import {
  useLayoutEffect,
  useResizeObserver,
  useValueEffect,
} from "@react-aria/utils";
import type { ToolbarButtonsProps } from "./types";

export interface ToolbarButtonsAria {
  toolbarButtonsProps: DOMAttributes;
  isMeasuring: boolean;
  visibleItems: number;
}

export function useToolbarButtons<T>(
  props: ToolbarButtonsProps<T>,
  state: ListState<T>,
  ref: RefObject<FocusableElement>,
): ToolbarButtonsAria {
  const focusManager = createFocusManager(ref);

  const onKeyDown = (e: React.KeyboardEvent<FocusableElement>) => {
    if (!Boolean(e.currentTarget.contains(e.target as Node))) {
      return;
    }

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        e.stopPropagation();

        focusManager.focusNext({ wrap: true });

        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        focusManager.focusPrevious({ wrap: true });

        break;
    }
  };

  const [{ isMeasuring, visibleItems }, setVisibleItems] = useValueEffect({
    visibleItems: state.collection.size,
    isMeasuring: false,
  });

  const updateOverflow = useCallback(() => {
    const computeVisibleItems = (visibleItems: number) => {
      if (ref.current) {
        const listItems = Array.from(ref.current.children) as HTMLLIElement[];
        const containerSize = ref.current.getBoundingClientRect().width;
        const isShowingMenu = visibleItems < state.collection.size;
        const lastItemIndex = isShowingMenu
          ? listItems.length - 2
          : listItems.length - 1;
        const minInlineSize = toNumber(
          window.getComputedStyle(listItems[lastItemIndex]).minInlineSize,
        );
        const gap = toNumber(window.getComputedStyle(ref.current).gap);
        let calculatedSize = 0;
        let newVisibleItems = 0;

        if (isShowingMenu) {
          const menuItem = listItems.pop();

          if (menuItem) {
            calculatedSize += menuItem.getBoundingClientRect().width + gap;
          }
        }

        for (const [i, item] of listItems.entries()) {
          const itemWidth = item.getBoundingClientRect().width;

          calculatedSize += itemWidth;

          if (i !== 0) {
            calculatedSize += gap;
          }

          if (calculatedSize <= containerSize) {
            newVisibleItems++;
          } else {
            const isSeparator = item.hasAttribute("data-separator");

            // check whether the truncated button will fit container
            if (
              !isSeparator &&
              calculatedSize - itemWidth + minInlineSize <= containerSize
            ) {
              newVisibleItems++;
            }

            break;
          }
        }

        return newVisibleItems;
      }

      return visibleItems;
    };

    setVisibleItems(function* () {
      // Update to show all items.
      yield {
        visibleItems: state.collection.size,
        isMeasuring: true,
      };

      const newVisibleItems = computeVisibleItems(state.collection.size);
      const isMeasuring =
        newVisibleItems < state.collection.size && newVisibleItems > 0;

      yield {
        visibleItems: newVisibleItems,
        isMeasuring,
      };

      // If the number of items is less than the number of children,
      // then update again to ensure that the menu fits.
      if (isMeasuring) {
        yield {
          visibleItems: computeVisibleItems(newVisibleItems),
          isMeasuring: false,
        };
      }
    });
  }, [ref, state.collection, setVisibleItems]);

  const parentRef = useMemo(
    () => ({
      get current() {
        return ref.current?.parentElement;
      },
    }),
    [ref],
  );

  useResizeObserver({
    ref: parentRef,
    onResize: updateOverflow,
  });
  useLayoutEffect(updateOverflow, [updateOverflow, state.collection]);

  return {
    toolbarButtonsProps: {
      onKeyDown,
    },
    isMeasuring,
    visibleItems,
  };
}

function toNumber(value: string) {
  const parsed = parseInt(value, 10);

  return isNaN(parsed) ? 0 : parsed;
}
