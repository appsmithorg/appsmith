import { createFocusManager } from "@react-aria/focus";
import { useCallback, type RefObject, useMemo } from "react";
import type { ListState } from "@react-stately/list";
import type { DOMAttributes, FocusableElement } from "@react-types/shared";
import type { ORIENTATION } from "../../../shared/orientation";

import type { InlineButtonsProps } from "./types";
import {
  useLayoutEffect,
  useResizeObserver,
  useValueEffect,
} from "@react-aria/utils";

export interface InlineButtonsAria {
  inlineButtonsProps: DOMAttributes;
  orientation: keyof typeof ORIENTATION;
}

export function useInlineButtons<T>(
  props: InlineButtonsProps<T>,
  state: ListState<T>,
  ref: RefObject<FocusableElement>,
): InlineButtonsAria {
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

  const [orientation, setOrientation] =
    useValueEffect<keyof typeof ORIENTATION>("horizontal");

  const updateOverflow = useCallback(() => {
    const computeOrientation = (): keyof typeof ORIENTATION => {
      if (ref.current) {
        const listItems = Array.from(ref.current.children) as HTMLLIElement[];
        const containerSize = ref.current.getBoundingClientRect().width;
        const gap = toNumber(window.getComputedStyle(ref.current).gap);
        let calculatedSize = 0;

        for (const [i, item] of listItems.entries()) {
          const itemWidth = item.getBoundingClientRect().width;

          calculatedSize += itemWidth;

          if (i !== 0) {
            calculatedSize += gap;
          }

          if (calculatedSize > containerSize) {
            return "vertical";
          }
        }
      }

      return "horizontal";
    };

    setOrientation(function* () {
      yield "horizontal";

      yield computeOrientation();
    });
  }, [ref, state.collection, setOrientation]);

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
    inlineButtonsProps: {
      "aria-orientation": orientation,
      onKeyDown,
    },
    orientation,
  };
}

function toNumber(value: string) {
  const parsed = parseInt(value, 10);

  return isNaN(parsed) ? 0 : parsed;
}
