import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import { LINTER_TYPE } from "../constants";
import { generateLintingGlobalData } from "../utils/getLintingErrors";

jest.mock("ee/hooks", () => {
  const actualModule = jest.requireActual("ee/hooks");

  return {
    ...actualModule, // Spread the original module exports
    getEditorType: jest.fn(() => "TestEditorType"), // Override `getEditorType`
  };
});

describe("generateLintingGlobalData", () => {
  it("should generate the correct response type", () => {
    const mockData = {
      Query1: {
        ENTITY_TYPE: ENTITY_TYPE.ACTION,
      },
      JSObject1: {
        ENTITY_TYPE: ENTITY_TYPE.JSACTION,
        myFun1: "function() {}",
        myFun2: "async function() {}",
        test: "async function() {}",
        body: "Some body text",
        actionId: "action-id",
      },
      appsmith: {
        ENTITY_TYPE: ENTITY_TYPE.APPSMITH,
        URL: { pathname: "/test/editor/path" },
      },
    };

    const result = generateLintingGlobalData(mockData, LINTER_TYPE.ESLINT);

    expect(result.globalData).toEqual({
      setTimeout: "readonly",
      clearTimeout: "readonly",
      console: "readonly",
      Query1: "readonly",
      JSObject1: "readonly",
      appsmith: "readonly",
      crypto: "readonly",
      forge: "readonly",
      moment: "readonly",
      _: "readonly",
      fetch: "readonly",
    });

    expect(result.asyncFunctions).toEqual([
      "Query1.run",
      "JSObject1.myFun2",
      "JSObject1.test",
    ]);

    expect(result.editorType).toEqual("TestEditorType");
  });

  it("should handle an empty input and return default values", () => {
    const result = generateLintingGlobalData({}, LINTER_TYPE.ESLINT);

    expect(result.globalData).toEqual({
      setTimeout: "readonly",
      clearTimeout: "readonly",
      console: "readonly",
      crypto: "readonly",
      forge: "readonly",
      moment: "readonly",
      _: "readonly",
      fetch: "readonly",
    });

    expect(result.asyncFunctions).toEqual([]);
  });

  it("should handle unsupported ENTITY_TYPE gracefully", () => {
    const mockData = {
      UnknownEntity: {
        ENTITY_TYPE: "UNKNOWN",
      },
    };

    const result = generateLintingGlobalData(mockData, LINTER_TYPE.ESLINT);

    expect(result.globalData).toEqual({
      setTimeout: "readonly",
      clearTimeout: "readonly",
      console: "readonly",
      UnknownEntity: "readonly",
      crypto: "readonly",
      forge: "readonly",
      moment: "readonly",
      _: "readonly",
      fetch: "readonly",
    });

    expect(result.asyncFunctions).toEqual([]);
  });
});
