import { createFocusManager } from "@react-aria/focus";
import type { ListState } from "@react-stately/list";
import { useCallback, type RefObject, useMemo } from "react";
import type { DOMAttributes, FocusableElement } from "@react-types/shared";

import type { ActionGroupProps } from "./types";
import {
  useLayoutEffect,
  useResizeObserver,
  useValueEffect,
} from "@react-aria/utils";

export interface ActionGroupAria {
  actionGroupProps: DOMAttributes;
  isMeasuring: boolean;
  visibleItems: number;
}

export function useActionGroup<T>(
  props: ActionGroupProps<T>,
  state: ListState<T>,
  ref: RefObject<FocusableElement>,
): ActionGroupAria {
  const { orientation, overflowMode = "collapse" } = props;
  const focusManager = createFocusManager(ref);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!Boolean((e.currentTarget as Node).contains(e.target as Node))) {
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
    if (overflowMode === "wrap") {
      return;
    }

    if (orientation === "vertical") {
      // Collapsing vertical action groups with selection is currently unsupported.
      return;
    }

    const computeVisibleItems = (visibleItems: number) => {
      if (ref.current) {
        const listItems = Array.from(ref.current.children) as HTMLLIElement[];
        const containerSize = ref.current.getBoundingClientRect().width;

        const isShowingMenu = visibleItems < state.collection.size;
        let calculatedSize = 0;
        let newVisibleItems = 0;

        if (isShowingMenu) {
          const item = listItems.pop();
          if (item) {
            calculatedSize += outerWidth(
              item,
              window.getComputedStyle(ref.current).gap,
            );
          }
        }

        for (const [i, item] of listItems.entries()) {
          calculatedSize += outerWidth(
            item,
            i === 0 ? "0" : window.getComputedStyle(ref.current).gap,
          );

          if (Math.round(calculatedSize) <= Math.round(containerSize)) {
            newVisibleItems++;
          } else {
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
  }, [ref, state.collection, setVisibleItems, overflowMode, orientation]);

  const parentRef = useMemo(
    () => ({
      get current() {
        return ref.current?.parentElement;
      },
    }),
    [ref],
  );

  useResizeObserver({
    ref: overflowMode !== "wrap" ? parentRef : undefined,
    onResize: updateOverflow,
  });
  useLayoutEffect(updateOverflow, [updateOverflow, state.collection]);

  return {
    actionGroupProps: {
      "aria-orientation": orientation,
      onKeyDown,
    },
    isMeasuring,
    visibleItems,
  };
}

function outerWidth(element: HTMLElement, gap: string) {
  return element.getBoundingClientRect().width + toNumber(gap);
}

function toNumber(value: string) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}
