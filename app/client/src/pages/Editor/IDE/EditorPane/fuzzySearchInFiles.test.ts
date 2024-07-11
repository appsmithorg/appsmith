import type { EditorSegmentList } from "@appsmith/selectors/appIDESelectors";
import { fuzzySearchInFiles } from "./utils";
import { PluginType } from "entities/Action";

const sampleFiles: EditorSegmentList = [
  {
    group: "Group 1",
    items: [
      { title: "file1.js", type: PluginType.API, key: "file1" },
      { title: "file2.js", type: PluginType.API, key: "file2" },
    ],
  },
  {
    group: "Group 2",
    items: [
      { title: "file3.js", type: PluginType.API, key: "file3" },
      { title: "file4.js", type: PluginType.API, key: "file4" },
    ],
  },
];

describe("fuzzySearchInFiles", () => {
  it("should return all files when the search string is empty", () => {
    const result = fuzzySearchInFiles("", sampleFiles);
    expect(result).toEqual(sampleFiles);
  });

  it("should return the correct file when the search string exactly matches a file title", () => {
    const result = fuzzySearchInFiles("file1", sampleFiles);
    expect(result).toEqual([
      {
        group: "Group 1",
        items: [{ title: "file1.js", type: PluginType.API, key: "file1" }],
      },
    ]);
  });

  it("should return an empty array when no files match the search string", () => {
    const result = fuzzySearchInFiles("nonexistentfile", sampleFiles);
    expect(result).toEqual([]);
  });

  it("should return all files containing the common substring in their titles", () => {
    const result = fuzzySearchInFiles("file", sampleFiles);
    expect(result).toEqual(sampleFiles);
  });
});
