import { fetchDefaultDocs, DocSearchItem } from "./utils";
import * as githubHelper from "./githubHelper";

// we mock the actual API call that uses "fetch"
// and make sure that this is called from the
// module we are testing(utils)
jest.mock("./githubHelper", () => ({
  fetchRawGithubContentList: jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(githubHelper.defaultDocsConfig),
    }),
  ),
}));

describe("globalsearch utils", () => {
  it("returns default github docs", async () => {
    let documents = [];
    await fetchDefaultDocs(
      (truthy: boolean) => {
        // do nothing for now
        // to turn off errors
        expect(truthy === null || typeof truthy === "boolean").toBeTruthy();
      },
      (docs: DocSearchItem[]) => {
        documents = docs;
        expect(documents.length).toEqual(4);
      },
      0,
      2,
    );
  });
  it("makes sure that the helper dependency function is also called", async () => {
    expect(githubHelper.fetchRawGithubContentList).toBeCalled();
  });
});
