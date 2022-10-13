import { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";

export function getMetaWidgetChildrenIds(
  metaWidgets: MetaWidgetsReduxState,
  parentIds: string[],
): string[] {
  const childrenIds: string[] = [];

  parentIds.forEach((parentId) => {
    const metaIds = getMetaWidgetIdsByCreatorId(metaWidgets, parentId);
    childrenIds.push(...metaIds);
  });

  return childrenIds;
}

function getMetaWidgetIdsByCreatorId(
  metaWidgets: MetaWidgetsReduxState,
  creatorId: string,
): string[] {
  const metaWidgetIds: string[] = [];

  Object.keys(metaWidgets).forEach((metaWidgetId) => {
    if (metaWidgets[metaWidgetId].creatorId === creatorId) {
      metaWidgetIds.push(metaWidgetId);
    }
  });
  return metaWidgetIds;
}
