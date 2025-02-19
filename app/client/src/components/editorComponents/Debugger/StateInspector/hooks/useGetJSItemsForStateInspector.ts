import { useSelector } from "react-redux";
import { getJSSegmentItems } from "ee/selectors/entitiesSelector";
import type { GetGroupHookType } from "../types";

export const useGetJSItemsForStateInspector: GetGroupHookType = () => {
  const jsObjects = useSelector(getJSSegmentItems);

  const jsItems = jsObjects.map((jsObject) => ({
    id: jsObject.key,
    title: jsObject.title,
    startIcon: jsObject.icon,
  }));

  return { group: "JS objects", items: jsItems };
};
