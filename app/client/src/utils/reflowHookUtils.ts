import { OccupiedSpace } from "constants/CanvasEditorConstants";
import { FlattenedWidgetProps } from "reducers/entityReducers/canvasWidgetsReducer";
import { GridProps, ReflowedSpace, ReflowedSpaceMap } from "reflow/reflowTypes";

export function collisionCheckPostReflow(
  widgets: {
    [widgetId: string]: FlattenedWidgetProps;
  },
  reflowWidgetKeys: string[],
  parentId?: string,
) {
  const widgetKeys = Object.keys(widgets).filter((widgetId) => {
    if (!widgets[widgetId].parentId) return false;

    if (widgets[widgetId].parentId !== parentId) return false;

    if (widgets[widgetId].type === "MODAL_WIDGET") return false;

    return true;
  });

  for (const reflowedKey of reflowWidgetKeys) {
    for (const widgetId of widgetKeys) {
      if (areIntersecting(widgets[reflowedKey], widgets[widgetId])) {
        return false;
      }
    }
  }

  return true;
}

function areIntersecting(r1: FlattenedWidgetProps, r2: FlattenedWidgetProps) {
  if (r1.widgetId === r2.widgetId) return false;

  return !(
    r2.leftColumn >= r1.rightColumn ||
    r2.rightColumn <= r1.leftColumn ||
    r2.topRow >= r1.bottomRow ||
    r2.bottomRow <= r1.topRow
  );
}

export function getBottomRowAfterReflow(
  movementMap: ReflowedSpaceMap | undefined,
  widgetBottom: number,
  occupiedSpaces: OccupiedSpace[],
  gridProps: GridProps,
) {
  const reflowedWidgets: [string, ReflowedSpace][] = Object.entries(
    movementMap || {},
  );
  const bottomReflowedWidgets = reflowedWidgets.filter((each) => !!each[1].Y);

  const reflowedWidgetsBottomMostRow = bottomReflowedWidgets.reduce(
    (bottomMostRow, each) => {
      const [id, reflowedParams] = each;
      const widget = occupiedSpaces.find((eachSpace) => eachSpace.id === id);
      if (widget) {
        const bottomMovement =
          (reflowedParams.Y || 0) / gridProps.parentRowSpace;
        const bottomRow = widget.bottom + bottomMovement;
        if (bottomRow > bottomMostRow) {
          return bottomRow;
        }
      }
      return bottomMostRow;
    },
    0,
  );

  return Math.max(reflowedWidgetsBottomMostRow, widgetBottom);
}
