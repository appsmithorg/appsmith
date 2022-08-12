import { OccupiedSpace } from "constants/CanvasEditorConstants";

export const getAlignmentLines = (
  occupiedSpaces: OccupiedSpace[],
  viewPort: { topRow: number; bottomRow: number },
): { x: number; y: number }[] => {
  return [{ x: 1, y: 2 }];
};
