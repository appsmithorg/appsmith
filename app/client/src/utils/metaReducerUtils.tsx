import { MetaCanvasWidgetsReduxState } from "reducers/entityReducers/metaCanvasWidgetsReducer";

export function getMetaWidgetChildrenIds(
  metaWidgets: MetaCanvasWidgetsReduxState,
  parentIds: string[],
): string[] {
  const childrenIds: string[] = [];

  parentIds.forEach((parentId) => {
    const metaIds = getMetaWidgetByCreatorId(metaWidgets, parentId);
    childrenIds.push(...metaIds);
  });

  return childrenIds;
}

function getMetaWidgetByCreatorId(
  metaWidgets: MetaCanvasWidgetsReduxState,
  parentId: string,
): string[] {
  const metaWidgetIds: string[] = [];

  Object.keys(metaWidgets).forEach((metaWidgetId) => {
    if (metaWidgets[metaWidgetId].creatorId === parentId) {
      metaWidgetIds.push(metaWidgetId);
    }
  });
  return metaWidgetIds;
}
