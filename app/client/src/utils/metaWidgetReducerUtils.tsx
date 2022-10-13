import { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";

export function getMetaWidgetChildrenIds(
  metaWidgets: MetaWidgetsReduxState,
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
  metaWidgets: MetaWidgetsReduxState,
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
