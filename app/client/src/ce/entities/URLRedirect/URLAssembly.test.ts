import urlBuilder, { URLBuilder } from "./URLAssembly";
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
      expect(pageId).toBe(testPageId); // Ensure the overridden pageId is used
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
});
