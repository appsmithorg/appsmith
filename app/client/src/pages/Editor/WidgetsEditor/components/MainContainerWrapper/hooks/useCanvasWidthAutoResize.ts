import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";

import { updateCanvasLayoutAction } from "actions/editorActions";
import { DefaultLayoutType } from "constants/WidgetConstants";
import { getCurrentApplicationLayout } from "selectors/editorSelectors";

import { resolveCanvasWidth } from "../utils/resolveCanvasWidth";
import { RESIZE_DEBOUNCE_THRESHOLD } from "./constants";
import { getIsCanvasInitialized } from "selectors/mainCanvasSelectors";

export const useCanvasWidthAutoResize = (ref: React.RefObject<HTMLElement>) => {
  const dispatch = useDispatch();

  const isCanvasInitialized = useSelector(getIsCanvasInitialized);
  const { type: appLayoutType = DefaultLayoutType } = useSelector(
    getCurrentApplicationLayout,
  );

  useEffect(() => {
    if (!isCanvasInitialized && ref.current) {
      const resolvedCanvasWidth = resolveCanvasWidth({
        appLayoutType,
        containerWidth: ref.current.offsetWidth,
      });
      dispatch(updateCanvasLayoutAction(resolvedCanvasWidth));
    }
  }, [appLayoutType, dispatch, isCanvasInitialized, ref]);

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
            containerWidth: width,
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
  }, [ref, dispatch, appLayoutType]);

  return isCanvasInitialized;
};
