import type { OffsetType, PositionType } from "./walkthroughContext";

const DEFAULT_POSITION: PositionType = "top";

export const PADDING_HIGHLIGHT = 10;

interface PositionCalculator {
  offset?: OffsetType;
  targetId: string;
}

export function getPosition({ offset, targetId }: PositionCalculator) {
  const target = document.querySelector(targetId);
  const bodyCoordinates = document.body.getBoundingClientRect();

  if (!target) return null;

  let coordinates;

  if (target) {
    coordinates = target.getBoundingClientRect();
  }

  if (!coordinates) return null;

  const offsetValues = { top: offset?.top || 0, left: offset?.left || 0 };
  const extraStyles = offset?.style || {};

  /**
   *      . - - - - - - - - - - - - - - - - - .
   *      |                 Body              |
   *      |                                   |
   *      |      . - - - - - - - - - - .      |
   *      |      |      Offset         |      |
   *      |      |  . - - - - - - - .  |      |
   *      |      |  | / / / / / / / |  |      |
   *      |      |  | / / /Target/ /|  |      |
   *      |      |  | / / / / / / / |  |      |
   *      |      |  . - - - - - - - .  |      |
   *      |      |                     |      |
   *      |      . _ _ _ _ _ _ _ _ _ _ .      |
   *      |                                   |
   *      . - - - - - - - - - - - - - - - - - .
   */

  switch (offset?.position || DEFAULT_POSITION) {
    case "top":
      return {
        bottom:
          bodyCoordinates.height -
          coordinates.top -
          offsetValues.top +
          PADDING_HIGHLIGHT +
          "px",
        left: coordinates.left + offsetValues.left + PADDING_HIGHLIGHT + "px",
        transform: "translateX(-50%)",
        ...extraStyles,
      };
    case "bottom":
      return {
        top:
          coordinates.height +
          coordinates.top +
          offsetValues.top +
          PADDING_HIGHLIGHT +
          "px",
        left: coordinates.left + offsetValues.left - PADDING_HIGHLIGHT + "px",
        transform: "translateX(-50%)",
        ...extraStyles,
      };
    case "left":
      return {
        top: coordinates.top + offsetValues.top - PADDING_HIGHLIGHT + "px",
        right:
          bodyCoordinates.width -
          coordinates.left -
          offsetValues.left +
          PADDING_HIGHLIGHT +
          "px",
        transform: "translateY(-50%)",
        ...extraStyles,
      };
    case "right":
      return {
        top: coordinates.top + offsetValues.top - PADDING_HIGHLIGHT + "px",
        left:
          coordinates.left +
          coordinates.width +
          offsetValues.left +
          PADDING_HIGHLIGHT +
          "px",
        transform: "translateY(-50%)",
        ...extraStyles,
      };
  }
}

export function isElementVisible(el: HTMLElement) {
  return !!(el?.offsetWidth || el?.offsetHeight || el.getClientRects().length);
}
