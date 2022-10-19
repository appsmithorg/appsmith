import { MetaWidgetsReduxState } from "reducers/entityReducers/metaWidgetsReducer";
import get from "lodash/get";

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
    if (metaWidgets[metaWidgetId]?.creatorId === creatorId) {
      if (metaWidgets[metaWidgetId]?.hasMetaWidgets) {
        const childWidgetsId = getNestedMetaWidgetChildrenIds(
          metaWidgets,
          metaWidgetId,
        );
        metaWidgetIds.push(...childWidgetsId);
      } else {
        metaWidgetIds.push(metaWidgetId);
      }
    }
  });
  return metaWidgetIds;
}

export function getNestedMetaWidgetChildrenIds(
  metaWidgets: MetaWidgetsReduxState,
  parentId: string,
): string[] {
  const childrenIds = getMetaWidgetChildrenIdsRecursively(
    metaWidgets,
    parentId,
  );

  return [parentId, ...childrenIds];
}

export function getMetaWidgetChildrenIdsRecursively(
  metaWidgets: MetaWidgetsReduxState,
  widgetId: string,
): string[] {
  const childrenIds: string[] = [];
  const widget = get(metaWidgets, widgetId);
  if (widget === undefined) {
    return [];
  }
  const { children = [] } = widget;
  if (children && children.length) {
    childrenIds.push(...children);
    for (const metaWidgetId of children) {
      if (metaWidgets[metaWidgetId]) {
        const grandChildrenId = getMetaWidgetChildrenIdsRecursively(
          metaWidgets,
          metaWidgetId,
        );
        if (grandChildrenId && grandChildrenId.length) {
          childrenIds.push(...grandChildrenId);
        }
      }
    }
  }
  return childrenIds;
}

export const getMetaWidgetCreatorIds = (
  metaWidgets: MetaWidgetsReduxState,
  metaWidgetIds: string[],
) => {
  return metaWidgetIds.filter(
    (metaWidgetId) => metaWidgets[metaWidgetId].hasMetaWidgets,
  );
};
