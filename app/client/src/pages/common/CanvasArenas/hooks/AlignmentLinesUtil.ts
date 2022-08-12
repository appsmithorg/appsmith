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
  // const widgetPoints: WidgetPoints[] = getOccupiedSpacesInViewPort(
  //   occupiedSpaces,
  //   viewPort,
  // );
  return [
    [
      { x: 1, y: 2 },
      { x: 2, y: 3 },
    ],
  ];
};
// function getOccupiedSpacesInViewPort(
//   occupiedSpaces: OccupiedSpace[],
//   viewPort: { topRow: number; bottomRow: number },
// ): WidgetPoints[] {
//   const occupiedSpacesInViewPort: OccupiedSpace[] = [];

//   for (const occupiedSpace of occupiedSpaces) {
//     if (
//       occupiedSpace.bottom > viewPort.topRow &&
//       occupiedSpace.top < viewPort.bottomRow
//     ) {
//       occupiedSpacesInViewPort;
//     }
//   }
// }
