import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";

import { updateCanvasLayoutAction } from "actions/editorActions";
import {
  DefaultLayoutType,
  MAIN_CONTAINER_WIDGET_ID,
} from "constants/WidgetConstants";
import {
  getCurrentApplicationLayout,
  getMainCanvasProps,
} from "selectors/editorSelectors";
import { getIsCanvasInitialized } from "selectors/mainCanvasSelectors";
import { updateLayoutForMobileBreakpointAction } from "actions/autoLayoutActions";
import { LayoutSystemTypes } from "layoutSystems/types";
import { getLayoutSystemType } from "selectors/layoutSystemSelectors";
import { scrollbarWidth } from "utils/helpers";

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

  const layoutSystemType = useSelector(getLayoutSystemType);
  const { isMobile } = useSelector(getMainCanvasProps);

  useEffect(() => {
    if (!isCanvasInitialized && ref.current) {
      const resolvedCanvasWidth = resolveCanvasWidth({
        appLayoutType,
        containerWidth:
          ref.current.offsetWidth - sidebarWidth - scrollbarWidth(),
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
            containerWidth: width - sidebarWidth - scrollbarWidth(),
          });

          // TODO: this is for AutoLayout only, remove when AutoLayout is sunset.
          dispatch(
            updateLayoutForMobileBreakpointAction(
              MAIN_CONTAINER_WIDGET_ID,
              layoutSystemType === LayoutSystemTypes.AUTO ? isMobile : false,
              resolvedCanvasWidth,
            ),
          );

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
  }, [ref, dispatch, appLayoutType, sidebarWidth, layoutSystemType, isMobile]);

  return isCanvasInitialized;
};
