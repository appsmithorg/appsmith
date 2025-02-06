import Fuse from "fuse.js";

const searchConfig = {
  keys: ["name"],
  shouldSort: true,
  threshold: 0.6,
  location: 0,
  distance: 100,
};

export function filterSearch(
  list: { name: string }[],
  searchString: string = "",
) {
  if (searchString.length === 0) return list;

  const fusesearch = new Fuse(list, searchConfig);

  return fusesearch.search(searchString);
}
