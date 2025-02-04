export function filterSearch(
  list: { name: string }[],
  searchString: string = "",
) {
  const regex = new RegExp(
    `.*?${[...searchString].map((c) => `(${c})`).join(".*?")}.*?`,
    "i",
  );

  return list.filter((item) => regex.test(item.name.toLocaleLowerCase()));
}
