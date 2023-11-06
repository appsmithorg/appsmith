import urlBuilder, {
  URLBuilder,
  getQueryStringfromObject,
} from "./URLAssembly";
import { APP_MODE } from "entities/App";

describe("URLBuilder", () => {
  beforeEach(() => {
    // Reset the URLBuilder instance before each test
    urlBuilder.resetURLParams();
  });

  it("should correctly set and use currentPageId in build function when currentPageId is set", () => {
    const testPageId = "testPageId";
    const testMode = APP_MODE.EDIT;

    urlBuilder.setCurrentPageId(testPageId);

    const builderParams = {
      suffix: "testSuffix",
      branch: "testBranch",
      hash: "testHash",
      params: { param1: "value1", param2: "value2" },
      persistExistingParams: true,
    };

    URLBuilder.prototype.generateBasePath = jest.fn((pageId, mode) => {
      expect(pageId).toBe(testPageId); // Ensure the current page id is used
      expect(mode).toBe(testMode);
      return `mockedBasePath/${pageId}/${mode}`;
    });

    const result = urlBuilder.build(builderParams, testMode);

    expect(URLBuilder.prototype.generateBasePath).toHaveBeenCalledWith(
      testPageId,
      testMode,
    );

    expect(result).toEqual(
      "mockedBasePath/testPageId/EDIT/testSuffix?param1=value1&param2=value2&branch=testBranch#testHash",
    );
  });

  it("should correctly set and use pageId in build function when currentPageId is set to null", () => {
    const testPageId = "testPageId";
    const testMode = APP_MODE.EDIT;

    // Set currentPageId to null
    urlBuilder.setCurrentPageId(null);

    const builderParams = {
      suffix: "testSuffix",
      branch: "testBranch",
      hash: "testHash",
      params: { param1: "value1", param2: "value2" },
      pageId: testPageId, // Set the pageId to be used
      persistExistingParams: true,
    };

    URLBuilder.prototype.generateBasePath = jest.fn((pageId, mode) => {
      expect(pageId).toBe(testPageId); // Ensure the passed pageId is used
      expect(mode).toBe(testMode);
      return `mockedBasePath/${pageId}/${mode}`;
    });

    const result = urlBuilder.build(builderParams, testMode);

    expect(URLBuilder.prototype.generateBasePath).toHaveBeenCalledWith(
      testPageId,
      testMode,
    );

    expect(result).toEqual(
      "mockedBasePath/testPageId/EDIT/testSuffix?param1=value1&param2=value2&branch=testBranch#testHash",
    );
  });

  it("should correctly set and use pageId in build function when currentPageId is set", () => {
    const currentPageId = "currentPageId";
    const testPageId = "testPageId";
    const testMode = APP_MODE.EDIT;

    urlBuilder.setCurrentPageId(currentPageId);

    const builderParams = {
      suffix: "testSuffix",
      branch: "testBranch",
      hash: "testHash",
      params: { param1: "value1", param2: "value2" },
      pageId: testPageId, // This should override the current page id
      persistExistingParams: true,
    };

    URLBuilder.prototype.generateBasePath = jest.fn((pageId, mode) => {
      return `mockedBasePath/${pageId}/${mode}`;
    });

    const result = urlBuilder.build(builderParams, testMode);

    expect(URLBuilder.prototype.generateBasePath).toHaveBeenCalledWith(
      testPageId,
      testMode,
    );

    expect(result).toEqual(
      "mockedBasePath/testPageId/EDIT/testSuffix?param1=value1&param2=value2&branch=testBranch#testHash",
    );
  });

  it("should throw an error when pageId is missing", () => {
    urlBuilder.setCurrentPageId(null);

    expect(() => {
      urlBuilder.build({}, APP_MODE.EDIT);
    }).toThrow(URIError);
  });
});

describe(".getQueryStringfromObject", () => {
  const cases = [
    {
      index: 0,
      input: { id: 0, a: "b&c ltd" },
      expected: "?id=0&a=b%26c%20ltd",
    },
    { index: 1, input: {}, expected: "" },
    {
      index: 2,
      input: { rando: "রিমিল" },
      expected: "?rando=%E0%A6%B0%E0%A6%BF%E0%A6%AE%E0%A6%BF%E0%A6%B2",
    },
    {
      index: 3,
      input: { a1: "1234*&^%~`<>:';,./?" },
      expected: "?a1=1234*%26%5E%25~%60%3C%3E%3A'%3B%2C.%2F%3F",
    },
    { index: 4, input: { isSignedIn: false }, expected: "?isSignedIn=false" },
  ];

  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (_, input, expected) => {
      const result = getQueryStringfromObject(input as any);
      expect(result).toStrictEqual(expected);
    },
  );
});
