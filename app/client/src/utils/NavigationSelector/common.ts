import { ENTITY_TYPE } from "entities/DataTree/types";
import type {
  EntityNavigationData,
  NavigationData,
} from "selectors/navigationSelectors";

export const createNavData = (general: {
  name: string;
  id: string;
  type: ENTITY_TYPE;
  children: EntityNavigationData;
  key?: string;
  url: string | undefined;
  peekable: boolean;
  peekData: unknown;
}): NavigationData => {
  return {
    name: general.name,
    id: general.id,
    type: general.type,
    children: general.children,
    key: general.key,
    url: general.url,
    navigable: !!general.url,
    peekable: general.peekable,
    peekData: general.peekData,
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
          entityNavigationData[key] = createNavData({
            id: childKey,
            name: childKey,
            type: ENTITY_TYPE.APPSMITH,
            children: result.entityNavigationData,
            url: undefined,
            peekable: true,
            peekData: undefined,
          });
        } else {
          peekData[key] = data[key];
          entityNavigationData[key] = createNavData({
            id: childKey,
            name: childKey,
            type: ENTITY_TYPE.APPSMITH,
            children: {},
            url: undefined,
            peekable: true,
            peekData: undefined,
          });
        }
      } else {
        peekData[key] = isTernFunctionDef(defs[key])
          ? // eslint-disable-next-line @typescript-eslint/no-empty-function
            function () {} // tern inference required here
          : data[key];
        entityNavigationData[key] = createNavData({
          id: childKey,
          name: childKey,
          type: ENTITY_TYPE.APPSMITH,
          children: {},
          url: undefined,
          peekable: true,
          peekData: undefined,
        });
      }
    }
  });
  return { peekData, entityNavigationData };
};

const isObject = (data: any) =>
  typeof data === "object" && !Array.isArray(data) && data !== null;
