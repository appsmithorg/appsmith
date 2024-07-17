import Fuse from "fuse.js";
import get from "lodash/get";

export const createAddClassName = (name: string) => {
  return "t--datasoucre-create-option-" + name.toLowerCase().replace(/ /g, "_");
};

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.1,
};

export const fuzzySearchInObjectItems = <T extends any[]>(
  searchStr: string,
  files: T,
  keysToSearch = ["title"],
  itemsKey = "items",
): T => {
  if (searchStr && searchStr !== "") {
    const newFiles = files
      .map((group: any) => {
        const items = get(group, itemsKey);
        const fuse = new Fuse(items, { ...FUSE_OPTIONS, keys: keysToSearch });
        const resultItems = fuse.search(searchStr);
        return { ...group, items: resultItems };
      })
      .filter((group) => group.items.length > 0);
    return newFiles as T;
  }

  return files;
};
