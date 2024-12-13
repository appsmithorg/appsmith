import Fuse, { type FuseOptions } from "fuse.js";

/** Searchable properties. Must be defined in this way to be able to derive union type and satisfy FuseOptions  */
const keys: ["title"] = ["title"];

/** Union type to make sure these particular keys are present in collection that's being passed in for search. */
type Keys = (typeof keys)[number];

type BaseGroup = Record<PropertyKey, unknown>;
type BaseItem = Record<Keys, string | number>;
type Group<G extends BaseGroup, T extends BaseItem> = G & {
  items: T[];
};

const FUSE_OPTIONS: FuseOptions<BaseItem> = {
  shouldSort: true,
  threshold: 0.1,
  keys,
};

/** Filter entity groups by search term using fuse.js */
export const filterEntityGroupsBySearchTerm = <
  G extends BaseGroup,
  T extends BaseItem,
>(
  searchTerm: string,
  groups: Array<Group<G, T>>,
): Array<Group<G, T>> => {
  if (!searchTerm) {
    return groups;
  }

  return groups.reduce((result: Array<Group<G, T>>, group) => {
    const { items, ...rest } = group;
    const searchResults = new Fuse(items, FUSE_OPTIONS).search(searchTerm);

    if (searchResults.length) {
      result.push({ ...rest, items: searchResults } as Group<G, T>);
    }

    return result;
  }, []);
};
