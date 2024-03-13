import { getAnvilSpaceDistributionStatus } from "layoutSystems/anvil/integrations/selectors";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { getIsDragging } from "selectors/widgetDragSelectors";
const EventsToBlock = ["click", "pointerup", "mouseup", "touchend"];

export const useAnvilWidgetInteractionGuard = (
  ref: React.RefObject<HTMLDivElement>,
) => {
  const isDragging = useSelector(getIsDragging);
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);
  const allowEventPropagation = useRef(isDragging);
  useEffect(() => {
    allowEventPropagation.current = isDragging || isDistributingSpace;
  }, [isDragging, isDistributingSpace]);

  const handleFirstInteraction = (e: any) => {
    if (!(e.altKey || allowEventPropagation.current)) {
      e.stopPropagation();
    }
  };

  useEffect(() => {
    // allow click events to pass only if alt key is pressed in capture phase
    EventsToBlock.forEach((event) => {
      ref.current?.addEventListener(event, handleFirstInteraction, true);
    });

    return () => {
      EventsToBlock.forEach((event) => {
        ref.current?.removeEventListener(event, handleFirstInteraction, true);
      });
    };
  }, []);
};
