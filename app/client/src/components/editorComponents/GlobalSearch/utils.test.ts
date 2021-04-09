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

// simple mocked hook function
const simpleMockHookFn = jest.fn((docs: DocSearchItem[]) => {
  expect(docs.length).toEqual(4);
});

// simple mocked state function
const simpleMockStateFn = jest.fn((truthy: boolean) => {
  // do nothing for now
  // to turn off errors
  expect(truthy === null || typeof truthy === "boolean").toBeTruthy();
});

describe("globalsearch utils", () => {
  it("returns default github docs", async () => {
    await fetchDefaultDocs(simpleMockStateFn, simpleMockHookFn, 0, 2);
  });
  it("makes sure that the helper dependency function is also called", async () => {
    expect(githubHelper.fetchRawGithubContentList).toBeCalled();
  });
  it("makes sure that the hook function is also called", async () => {
    expect(simpleMockHookFn).toBeCalled();
  });
  it("makes sure that the state function is also called", async () => {
    expect(simpleMockStateFn).toBeCalled();
  });
});
