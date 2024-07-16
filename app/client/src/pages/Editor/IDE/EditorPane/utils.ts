import Fuse from "fuse.js";
import type { EditorSegmentList } from "@appsmith/selectors/appIDESelectors";

export const createAddClassName = (name: string) => {
  return "t--datasoucre-create-option-" + name.toLowerCase().replace(/ /g, "_");
};

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.1,
  keys: ["title"],
};

export const fuzzySearchInFiles = (
  searchStr: string,
  files: EditorSegmentList,
) => {
  if (searchStr && searchStr !== "") {
    const newFiles = files
      .map((group) => {
        const fuse = new Fuse(group.items, FUSE_OPTIONS);
        const resultItems = fuse.search(searchStr);
        return { ...group, items: resultItems };
      })
      .filter((group) => group.items.length > 0);
    return newFiles;
  }

  return files;
};
