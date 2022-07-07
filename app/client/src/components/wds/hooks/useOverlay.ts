import { useOnOutsideClick, TouchOrMouseEvent } from "./useOnOutsideClick";
import { useOpenAndCloseFocus } from "./useOpenAndCloseFocus";
import { useOnEscapePress } from "./useOnEscapePress";
import { useProvidedRefOrCreate } from "./useProvidedRefOrCreate";

export type UseOverlaySettings = {
  ignoreClickRefs?: React.RefObject<HTMLElement>[];
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusRef: React.RefObject<HTMLElement>;
  onEscape: (e: KeyboardEvent) => void;
  onClickOutside: (e: TouchOrMouseEvent) => void;
  overlayRef?: React.RefObject<HTMLDivElement>;
  preventFocusOnOpen?: boolean;
};

export type OverlayReturnProps = {
  ref: React.RefObject<HTMLDivElement>;
};

export const useOverlay = ({
  ignoreClickRefs,
  initialFocusRef,
  onClickOutside,
  onEscape,
  overlayRef: _overlayRef,
  preventFocusOnOpen,
  returnFocusRef,
}: UseOverlaySettings): OverlayReturnProps => {
  const overlayRef = useProvidedRefOrCreate<HTMLDivElement>(_overlayRef);
  useOpenAndCloseFocus({
    containerRef: overlayRef,
    returnFocusRef,
    initialFocusRef,
    preventFocusOnOpen,
  });
  useOnOutsideClick({
    containerRef: overlayRef,
    ignoreClickRefs,
    onClickOutside,
  });

  // We only want one overlay to close at a time
  const preventeddefaultCheckedEscape: UseOverlaySettings["onEscape"] = (
    event,
  ) => {
    onEscape(event);
    event.preventDefault();
  };
  useOnEscapePress(preventeddefaultCheckedEscape);
  return { ref: overlayRef };
};
