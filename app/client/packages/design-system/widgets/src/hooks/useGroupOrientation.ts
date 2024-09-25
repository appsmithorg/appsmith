import { useCallback, type RefObject, useMemo } from "react";
import {
  useLayoutEffect,
  useResizeObserver,
  useValueEffect,
} from "@react-aria/utils";
import type { POSITION } from "@appsmith/wds";
import type { Orientation } from "@react-types/shared";

export interface GroupAria {
  orientation?: Orientation;
}

export function useGroupOrientation(
  props: {
    orientation?: Orientation;
    optionsLabelPosition?: keyof typeof POSITION;
  },
  ref: RefObject<HTMLDivElement>,
): GroupAria {
  const [{ orientation }, setOrientation] = useValueEffect({
    orientation: props.orientation ?? "vertical",
  });

  const updateOverflow = useCallback(() => {
    const computeOrientation = () => {
      if (props.orientation === "vertical") return "vertical";

      if (ref.current) {
        const options = Array.from(ref.current.children) as HTMLLIElement[];

        const containerSize = ref.current.getBoundingClientRect().width;
        const gap = toNumber(window.getComputedStyle(ref.current).gap);
        let calculatedSize = 0;

        for (const [i, item] of options.entries()) {
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
      };

      const orientation = computeOrientation();

      yield {
        orientation: orientation,
      };
    });
  }, [ref, setOrientation, props.orientation, props.optionsLabelPosition]);

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
  useLayoutEffect(updateOverflow, [updateOverflow]);

  return {
    orientation,
  };
}

function toNumber(value: string) {
  const parsed = parseInt(value, 10);

  return isNaN(parsed) ? 0 : parsed;
}
