import type { FlattenedWidgetProps } from "WidgetProvider/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { select } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";

export function* updateWidgetsToBeDeleted(selectedWidgets: string[]) {
  const allWidgets: CanvasWidgetsReduxState = yield select(getWidgets);

  /**
   * Step 1: Track ZONE_WIDGETS that have been deleted.
   * and their parent CanvasWidgets.
   */
  const zonesToBeDeleted: string[] = [];
  const canvasZoneMap: { [key: string]: string[] } = {};

  selectedWidgets?.forEach((each: string) => {
    const widget: FlattenedWidgetProps | undefined = allWidgets[each];
    if (widget && widget.type === "ZONE_WIDGET") {
      if (widget.parentId) {
        if (canvasZoneMap[widget.parentId]) {
          canvasZoneMap[widget.parentId].push(each);
        } else {
          canvasZoneMap[widget.parentId] = [each];
        }
        zonesToBeDeleted.push(each);
      }
    }
  });

  if (!zonesToBeDeleted.length) return [];

  /**
   * Step 2: Identify all SectionWidgets that will be empty post deletion.
   */
  const emptySections: string[] = Object.keys(canvasZoneMap)
    .map((each: string) => {
      const canvas: FlattenedWidgetProps | undefined = allWidgets[each];
      if (
        canvas &&
        canvas.children &&
        canvas.children.length === canvasZoneMap[each].length
      ) {
        return canvas.parentId ?? null;
      }
      return null;
    })
    .filter((each) => each !== null) as string[];

  if (!emptySections.length) return [];

  /**
   * Step 3: Remove zones the belong to empty sections from the list of selected widgets.
   * and add the empty sections to the list of widgets to be deleted.
   */
  return [
    ...selectedWidgets.filter(
      (each: string) => !zonesToBeDeleted.includes(each),
    ),
    ...emptySections,
  ];
}
