import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";

import { updateCanvasLayoutAction } from "actions/editorActions";
import { DefaultLayoutType } from "constants/WidgetConstants";
import { getCurrentApplicationLayout } from "selectors/editorSelectors";
import { getIsCanvasInitialized } from "selectors/mainCanvasSelectors";

import { resolveCanvasWidth } from "./utils/resolveCanvasWidth";
import { RESIZE_DEBOUNCE_THRESHOLD } from "./constants";

interface UseCanvasWidthAutoResizeProps {
  /** Ref of the container element, used to obtain container width. */
  ref: React.RefObject<HTMLElement>;

  /** Width of sidebar to subtract from desired canvas width. */
  sidebarWidth?: number;
}

export const useCanvasWidthAutoResize = ({
  ref,
  sidebarWidth = 0,
}: UseCanvasWidthAutoResizeProps) => {
  const dispatch = useDispatch();

  const isCanvasInitialized = useSelector(getIsCanvasInitialized);
  const { type: appLayoutType = DefaultLayoutType } = useSelector(
    getCurrentApplicationLayout,
  );

  useEffect(() => {
    if (!isCanvasInitialized && ref.current) {
      const resolvedCanvasWidth = resolveCanvasWidth({
        appLayoutType,
        containerWidth: ref.current.offsetWidth - sidebarWidth,
      });
      dispatch(updateCanvasLayoutAction(resolvedCanvasWidth));
    }
  }, [appLayoutType, dispatch, isCanvasInitialized, ref, sidebarWidth]);

  useEffect(() => {
    const canvasContainerElement = ref.current;
    if (canvasContainerElement) {
      const debouncedResize = debounce(
        ([
          {
            contentRect: { width },
          },
        ]) => {
          const resolvedCanvasWidth = resolveCanvasWidth({
            appLayoutType,
            containerWidth: width - sidebarWidth,
          });

          dispatch(updateCanvasLayoutAction(resolvedCanvasWidth));
        },
        RESIZE_DEBOUNCE_THRESHOLD,
      );

      const resizeObserver = new ResizeObserver(debouncedResize);
      resizeObserver.observe(canvasContainerElement);

      return () => {
        resizeObserver.unobserve(canvasContainerElement);
      };
    }
  }, [ref, dispatch, appLayoutType, sidebarWidth]);

  return isCanvasInitialized;
};
