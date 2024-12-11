import { filterEntityGroupsBySearchTerm } from ".";

const groups = [
  {
    name: "Group 1",
    items: [{ title: "file1" }, { title: "file2" }],
  },
  {
    title: "Group 2",
    items: [{ title: "file3" }, { title: "file4" }],
  },
];

describe("filterEntityGroupsBySearchTerm", () => {
  test.each([
    ["", groups],
    [
      "file1",
      [
        {
          name: "Group 1",
          items: [{ title: "file1" }],
        },
      ],
    ],
    ["notfound", []],
    ["file", groups],
  ])("%s -> %j", (searchTerm, output) => {
    expect(filterEntityGroupsBySearchTerm(searchTerm, groups)).toEqual(output);
  });
});
