import { useSelector } from "react-redux";
import { getQuerySegmentItems } from "ee/selectors/entitiesSelector";
import type { GetGroupHookType } from "../types";

export const useGetQueryItemsForStateInspector: GetGroupHookType = () => {
  const queries = useSelector(getQuerySegmentItems);

  const queryItems = queries.map((query) => ({
    id: query.key,
    title: query.title,
    startIcon: query.icon,
    className: "query-item",
  }));

  return { group: "Queries", items: queryItems };
};
