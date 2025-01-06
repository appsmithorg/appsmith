import { useSelector } from "react-redux";
import { getUISegmentItems } from "ee/selectors/entitiesSelector";
import type { GetGroupHookType } from "../types";

export const useGetUIItemsForStateInspector: GetGroupHookType = () => {
  const widgets = useSelector(getUISegmentItems);

  const widgetItems = widgets.map((widget) => ({
    id: widget.key,
    title: widget.title,
    startIcon: widget.icon,
  }));

  return { group: "UI elements", items: widgetItems };
};
