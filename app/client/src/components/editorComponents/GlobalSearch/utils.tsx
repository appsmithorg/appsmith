export enum SEARCH_ITEM_TYPES {
  documentation = "documentation",
  action = "action",
  widget = "widget",
}
export const getItemType = (item: any): SEARCH_ITEM_TYPES => {
  let type: SEARCH_ITEM_TYPES;
  if (item.widgetName) type = SEARCH_ITEM_TYPES.widget;
  else if (item.kind === "document") type = SEARCH_ITEM_TYPES.documentation;
  else type = SEARCH_ITEM_TYPES.action;

  return type;
};
