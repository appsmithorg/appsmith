import Fuse from "fuse.js";

export const createAddClassName = (name: string) => {
  return "t--datasoucre-create-option-" + name.toLowerCase().replace(/ /g, "_");
};

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.1,
  keys: ["title"],
};

export const fuzzySearchInObjectItems = <T extends any[]>(
  searchStr: string,
  files: T,
): T => {
  if (searchStr && searchStr !== "") {
    const newFiles = files
      .map((group) => {
        const items = group["items"];
        const fuse = new Fuse(items, FUSE_OPTIONS);
        const resultItems = fuse.search(searchStr);
        return { ...group, items: resultItems };
      })
      .filter((group) => group.items.length > 0);
    return newFiles as T;
  }

  return files;
};
