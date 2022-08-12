import { OccupiedSpace } from "constants/CanvasEditorConstants";

type Point = {
  x: number;
  y: number;
};

type WidgetPoints = {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
  center: Point;
};

export const getAlignmentLines = (
  draggingSpace: OccupiedSpace,
  occupiedSpaces: OccupiedSpace[],
  viewPort: { topRow: number; bottomRow: number },
): Point[][] => {
  const currOccupiedSpaces: OccupiedSpace[] = getOccupiedInViewPort(
    occupiedSpaces,
    viewPort,
  );
  const horizontalLines: {
    [key: number]: { line: Point[]; distance: number };
  } = {};
  const verticalLines: {
    [key: number]: { line: Point[]; distance: number };
  } = {};

  for (const occipiedSpace of currOccupiedSpaces) {
    if (
      occipiedSpace.top === draggingSpace.top ||
      occipiedSpace.bottom === draggingSpace.top ||
      Math.abs((occipiedSpace.top - occipiedSpace.bottom) / 2) +
        occipiedSpace.top ===
        draggingSpace.top
    ) {
      addToLines(
        horizontalLines,
        occipiedSpace,
        draggingSpace,
        draggingSpace.top,
        true,
      );
    }

    if (
      occipiedSpace.top === draggingSpace.bottom ||
      occipiedSpace.bottom === draggingSpace.bottom ||
      Math.abs((occipiedSpace.top - occipiedSpace.bottom) / 2) +
        occipiedSpace.top ===
        draggingSpace.bottom
    ) {
      addToLines(
        horizontalLines,
        occipiedSpace,
        draggingSpace,
        draggingSpace.bottom,
        true,
      );
    }

    if (
      occipiedSpace.top ===
        Math.abs((draggingSpace.top - draggingSpace.bottom) / 2) +
          draggingSpace.top ||
      occipiedSpace.bottom ===
        Math.abs((draggingSpace.top - draggingSpace.bottom) / 2) +
          draggingSpace.top
    ) {
      addToLines(
        horizontalLines,
        occipiedSpace,
        draggingSpace,
        Math.abs((draggingSpace.top - draggingSpace.bottom) / 2) +
          draggingSpace.top,
        true,
      );
    }

    if (
      occipiedSpace.left === draggingSpace.left ||
      occipiedSpace.right === draggingSpace.left ||
      Math.abs((occipiedSpace.left - occipiedSpace.right) / 2) +
        occipiedSpace.left ===
        draggingSpace.left
    ) {
      addToLines(
        verticalLines,
        occipiedSpace,
        draggingSpace,
        draggingSpace.left,
        false,
      );
    }

    if (
      occipiedSpace.left === draggingSpace.right ||
      occipiedSpace.right === draggingSpace.right ||
      Math.abs((occipiedSpace.left - occipiedSpace.right) / 2) +
        occipiedSpace.left ===
        draggingSpace.right
    ) {
      addToLines(
        verticalLines,
        occipiedSpace,
        draggingSpace,
        draggingSpace.right,
        false,
      );
    }

    if (
      occipiedSpace.left ===
        Math.abs((draggingSpace.left - draggingSpace.right) / 2) +
          draggingSpace.left ||
      occipiedSpace.right ===
        Math.abs((draggingSpace.left - draggingSpace.right) / 2) +
          draggingSpace.left
    ) {
      addToLines(
        verticalLines,
        occipiedSpace,
        draggingSpace,
        Math.abs((draggingSpace.left - draggingSpace.right) / 2) +
          draggingSpace.left,
        false,
      );
    }
  }

  return [
    ...Object.values(horizontalLines).map((lineObject) => lineObject.line),
    ...Object.values(verticalLines).map((lineObject) => lineObject.line),
  ];
};

function getOccupiedInViewPort(
  occupiedSpaces: OccupiedSpace[],
  viewPort: { topRow: number; bottomRow: number },
): OccupiedSpace[] {
  const occupiedInViewPort: OccupiedSpace[] = [];

  for (const occupiedSpace of occupiedSpaces) {
    if (
      occupiedSpace.bottom > viewPort.topRow &&
      occupiedSpace.top < viewPort.bottomRow
    ) {
      occupiedInViewPort.push(occupiedSpace);
    }
  }

  return occupiedInViewPort;
}

function addToLines(
  lines: { [key: number]: { line: Point[]; distance: number } },
  occupiedSpace: OccupiedSpace,
  draggingSpace: OccupiedSpace,
  matchingNumber: number,
  isHorizontal: boolean,
) {
  let line: Point[] = [];
  let distance = 0;
  if (isHorizontal) {
    if (occupiedSpace.right > draggingSpace.right) {
      distance = occupiedSpace.left - draggingSpace.right;
      line = [
        {
          y: matchingNumber,
          x: occupiedSpace.left,
        },
        {
          y: matchingNumber,
          x: draggingSpace.right,
        },
      ];
    } else {
      distance = draggingSpace.left - occupiedSpace.right;
      line = [
        {
          y: matchingNumber,
          x: occupiedSpace.right,
        },
        {
          y: matchingNumber,
          x: draggingSpace.left,
        },
      ];
    }
  } else {
    if (occupiedSpace.bottom > draggingSpace.bottom) {
      distance = occupiedSpace.top - draggingSpace.bottom;
      line = [
        {
          x: matchingNumber,
          y: occupiedSpace.top,
        },
        {
          x: matchingNumber,
          y: draggingSpace.bottom,
        },
      ];
    } else {
      distance = draggingSpace.top - occupiedSpace.bottom;
      line = [
        {
          x: matchingNumber,
          y: occupiedSpace.bottom,
        },
        {
          x: matchingNumber,
          y: draggingSpace.top,
        },
      ];
    }
  }

  if (lines[matchingNumber] && lines[matchingNumber].distance < distance)
    return;

  lines[matchingNumber] = {
    line,
    distance,
  };
}
function getWidgetPoint(widgetSpace: OccupiedSpace): WidgetPoints {
  const { bottom, left, right, top } = widgetSpace;
  return {
    topLeft: { x: left, y: top },
    topRight: { x: right, y: top },
    bottomLeft: { x: left, y: bottom },
    bottomRight: { x: left, y: widgetSpace.bottom },
    center: { x: (right - left) / 2, y: (bottom - top) / 2 },
  };
}
