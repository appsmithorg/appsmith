import { ENTITY_TYPE } from "entities/DataTree/types";
import {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";

export const createNavData = (
  name: string,
  id: string,
  type: ENTITY_TYPE,
  navigable: boolean,
  url: string | undefined,
  peekable: boolean,
  peekData: unknown,
  children: EntityNavigationData,
  key?: string,
): NavigationData => {
  return {
    name,
    id,
    type,
    url,
    navigable,
    children,
    peekable,
    peekData,
    key,
  };
};
