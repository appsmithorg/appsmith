import { createFocusManager } from "@react-aria/focus";
import type { ListState } from "@react-stately/list";
import { useCallback, type RefObject, useMemo } from "react";
import type { DOMAttributes, FocusableElement } from "@react-types/shared";

import type { ButtonGroupProps } from "../../../";
import {
  useLayoutEffect,
  useResizeObserver,
  useValueEffect,
} from "@react-aria/utils";

export interface ButtonGroupAria {
  buttonGroupProps: DOMAttributes;
  isMeasuring: boolean;
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

  const [{ isMeasuring, orientation }, setOrientation] = useValueEffect({
    orientation: props.orientation,
    isMeasuring: false,
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

          if (calculatedSize >= containerSize) {
            return "vertical";
          }
        }
      }

      return "horizontal";
    };

    setOrientation(function* () {
      yield {
        orientation: "horizontal",
        isMeasuring: true,
      };

      const orientation = computeOrientation();

      yield {
        orientation: orientation,
        isMeasuring: true,
      };

      if (isMeasuring) {
        yield {
          orientation: orientation,
          isMeasuring: false,
        };
      }
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
    isMeasuring,
    orientation,
  };
}

function toNumber(value: string) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}
