import { createFocusManager } from "@react-aria/focus";
import type { ListState } from "@react-stately/list";
import { useCallback, type RefObject, useMemo } from "react";
import type { DOMAttributes, FocusableElement } from "@react-types/shared";

import type { ButtonGroupProps } from "./types";
import {
  useLayoutEffect,
  useResizeObserver,
  useValueEffect,
} from "@react-aria/utils";

export interface ButtonGroupAria {
  buttonGroupProps: DOMAttributes;
  orientation: ButtonGroupProps<object>["orientation"];
}

export function useButtonGroup<T>(
  props: ButtonGroupProps<T>,
  state: ListState<T>,
  ref: RefObject<FocusableElement>,
): ButtonGroupAria {
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

  const [{ orientation }, setOrientation] = useValueEffect({
    orientation: props.orientation,
  });

  const updateOverflow = useCallback(() => {
    if (props.orientation === "vertical") return;

    const computeOrientation = () => {
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
      yield {
        orientation: "horizontal",
      };

      const orientation = computeOrientation();

      yield {
        orientation: orientation,
      };
    });
  }, [ref, state.collection, setOrientation, props.orientation]);

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
    buttonGroupProps: {
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
