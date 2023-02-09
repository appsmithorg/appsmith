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

export const isTernFunctionDef = (data: any) =>
  typeof data === "string" && /^fn\((?:[\w,: \(\)->])*\) -> [\w]*$/.test(data);

export const createObjectNavData = (
  defs: any,
  data: any,
  parentKey: string,
  peekData: any,
  restrictKeysFrom: Record<string, boolean>,
) => {
  const entityNavigationData: EntityNavigationData = {};
  Object.keys(defs).forEach((key: string) => {
    if (key.indexOf("!") === -1) {
      const childKey = parentKey + "." + key;
      if (isObject(defs[key])) {
        if (Object.keys(defs[key]).length > 0 && !restrictKeysFrom[childKey]) {
          peekData[key] = {};
          const result = createObjectNavData(
            defs[key],
            data[key],
            childKey,
            peekData[key],
            restrictKeysFrom,
          );
          peekData[key] = result.peekData;
          entityNavigationData[key] = createNavData(
            childKey,
            childKey,
            ENTITY_TYPE.APPSMITH,
            false,
            undefined,
            true,
            undefined,
            result.entityNavigationData,
          );
        } else {
          peekData[key] = data[key];
          entityNavigationData[key] = createNavData(
            childKey,
            childKey,
            ENTITY_TYPE.APPSMITH,
            false,
            undefined,
            true,
            undefined,
            {},
          );
        }
      } else {
        peekData[key] = isTernFunctionDef(defs[key])
          ? // eslint-disable-next-line @typescript-eslint/no-empty-function
            function() {} // tern inference required here
          : data[key];
        entityNavigationData[key] = createNavData(
          childKey,
          childKey,
          ENTITY_TYPE.APPSMITH,
          false,
          undefined,
          true,
          undefined,
          {},
        );
      }
    }
  });
  return { peekData, entityNavigationData };
};

const isObject = (data: any) =>
  typeof data === "object" && !Array.isArray(data) && data !== null;
