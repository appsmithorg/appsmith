import type { OffsetType, PositionType } from "./walkthroughContext";

const DEFAULT_POSITION: PositionType = "top";

type PositionCalculator = {
  offset?: OffsetType;
  targetId: string;
};

export function getPosition({ offset, targetId }: PositionCalculator) {
  const target = document.querySelector(`#${targetId}`);
  const bodyCoordinates = document.body.getBoundingClientRect();
  if (!target) return null;
  let coordinates;
  if (target) {
    coordinates = target.getBoundingClientRect();
  }

  if (!coordinates) return null;

  const offsetValues = { top: offset?.top || 0, left: offset?.left || 0 };

  switch (offset?.position || DEFAULT_POSITION) {
    case "top":
      return {
        bottom:
          bodyCoordinates.height - coordinates.top + offsetValues.top + "px",
        left:
          coordinates.width / 2 + coordinates.left + offsetValues.left + "px",
        transform: "translateX(-50%)",
      };
    case "bottom":
      return {
        top: coordinates.height + coordinates.top + offsetValues.top + "px",
        left:
          coordinates.width / 2 + coordinates.left + offsetValues.left + "px",
        transform: "translateX(-50%)",
      };
    case "left":
      return {
        top: coordinates.height / 2 + coordinates.top + offsetValues.top + "px",
        right:
          bodyCoordinates.width - coordinates.left + offsetValues.left + "px",
        transform: "translateY(-50%)",
      };
    case "right":
      return {
        top: coordinates.height / 2 + coordinates.top + offsetValues.top + "px",
        left: coordinates.left + coordinates.width + offsetValues.left + "px",
        transform: "translateY(-50%)",
      };
  }
}
