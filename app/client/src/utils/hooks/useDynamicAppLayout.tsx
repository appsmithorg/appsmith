import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { updateCanvasLayoutAction } from "actions/editorActions";

import {
  DefaultLayoutType,
  layoutConfigurations,
} from "constants/WidgetConstants";

import { debounce } from "lodash";
import type { SupportedLayouts } from "reducers/entityReducers/pageListReducer";
import { getCurrentApplicationLayout } from "selectors/editorSelectors";

interface CalculateCanvasWidthProps {
  appLayoutType: SupportedLayouts;
  containerWidth: number;
}

const calculateCanvasWidth = ({
  appLayoutType,
  containerWidth,
}: CalculateCanvasWidthProps) => {
  const widthRange = layoutConfigurations[appLayoutType];
  const { maxWidth, minWidth } = widthRange;

  switch (true) {
    case maxWidth < 0:
    case containerWidth > minWidth && containerWidth < maxWidth:
      return containerWidth;
    case containerWidth < minWidth:
      return minWidth;
    case containerWidth > maxWidth:
      return maxWidth;
    default:
      return minWidth;
  }
};

export const useDynamicAppLayout = (ref: React.RefObject<HTMLElement>) => {
  const dispatch = useDispatch();
  const { type: appLayoutType = DefaultLayoutType } = useSelector(
    getCurrentApplicationLayout,
  );

  useEffect(() => {
    const canvasContainerElement = ref.current;
    if (canvasContainerElement) {
      const debouncedResize = debounce(
        ([
          {
            contentRect: { width },
          },
        ]) => {
          const calculatedWidth = calculateCanvasWidth({
            appLayoutType,
            containerWidth: width,
          });
          dispatch(updateCanvasLayoutAction(calculatedWidth));
        },
        100,
      );

      const resizeObserver = new ResizeObserver(debouncedResize);
      resizeObserver.observe(canvasContainerElement);

      return () => {
        resizeObserver.unobserve(canvasContainerElement);
      };
    }
  }, [ref, dispatch, appLayoutType]);
};
