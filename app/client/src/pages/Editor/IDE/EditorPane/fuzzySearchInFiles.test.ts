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
  it("should return all files if searchStr is empty", () => {
    const result = fuzzySearchInFiles("", sampleFiles);
    expect(result).toEqual(sampleFiles);
  });

  it("should return filtered files based on searchStr", () => {
    const result = fuzzySearchInFiles("file1", sampleFiles);
    expect(result).toEqual([
      {
        group: "Group 1",
        items: [{ title: "file1.js", type: PluginType.API, key: "file1" }],
      },
    ]);
  });

  it("should return empty array if no match found", () => {
    const result = fuzzySearchInFiles("nonexistentfile", sampleFiles);
    expect(result).toEqual([]);
  });

  it("should return filtered files from multiple groups", () => {
    const result = fuzzySearchInFiles("file", sampleFiles);
    expect(result).toEqual(sampleFiles);
  });
});
