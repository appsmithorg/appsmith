import TernServer, { Completion, createCompletionHeader } from "./TernServer";
import { MockCodemirrorEditor } from "../../../test/__mocks__/CodeMirrorEditorMock";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";

describe("Tern server", () => {
  it("Check whether the correct value is being sent to tern", () => {
    const testCases = [
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "{{Api.}}",
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: "{{Api.}}",
      },
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "a{{Api.}}",
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: "a{{Api.}}",
      },
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 2, line: 0 }),
            getLine: () => "a{{Api.}}",
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: "{{Api.}}",
      },
    ];

    testCases.forEach((testCase) => {
      const value = TernServer.getFocusedDynamicValue(testCase.input);
      expect(value).toBe(testCase.expectedOutput);
    });
  });

  it("Check whether the correct position is sent for querying autocomplete", () => {
    const testCases = [
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "{{Api.}}",
            somethingSelected: () => false,
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 0, line: 0 },
      },
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 0, line: 1 }),
            getLine: () => "{{Api.}}",
            somethingSelected: () => false,
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 0, line: 0 },
      },
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 3, line: 1 }),
            getLine: () => "g {{Api.}}",
            somethingSelected: () => false,
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 1, line: 0 },
      },
    ];

    testCases.forEach((testCase) => {
      const request = TernServer.buildRequest(testCase.input, {});

      expect(request.query.end).toEqual(testCase.expectedOutput);
    });
  });

  it(`Check whether the position is evaluated correctly for placing the selected
      autocomplete value`, () => {
    const testCases = [
      {
        input: {
          codeEditor: {
            value: "{{}}",
            cursor: { ch: 2, line: 0 },
            doc: ({
              getCursor: () => ({ ch: 2, line: 0 }),
              getLine: () => "{{}}",
              somethingSelected: () => false,
            } as unknown) as CodeMirror.Doc,
          },
          requestCallbackData: {
            completions: [{ name: "Api1" }],
            start: { ch: 2, line: 0 },
            end: { ch: 6, line: 0 },
          },
        },
        expectedOutput: { ch: 2, line: 0 },
      },
      {
        input: {
          codeEditor: {
            value: "\n {{}}",
            cursor: { ch: 3, line: 1 },
            doc: ({
              getCursor: () => ({ ch: 3, line: 1 }),
              getLine: () => " {{}}",
              somethingSelected: () => false,
            } as unknown) as CodeMirror.Doc,
          },
          requestCallbackData: {
            completions: [{ name: "Api1" }],
            start: { ch: 2, line: 1 },
            end: { ch: 6, line: 1 },
          },
        },
        expectedOutput: { ch: 3, line: 1 },
      },
    ];

    testCases.forEach((testCase) => {
      MockCodemirrorEditor.getValue.mockReturnValueOnce(
        testCase.input.codeEditor.value,
      );
      MockCodemirrorEditor.getCursor.mockReturnValueOnce(
        testCase.input.codeEditor.cursor,
      );
      MockCodemirrorEditor.getDoc.mockReturnValueOnce(
        testCase.input.codeEditor.doc,
      );

      const value: any = TernServer.requestCallback(
        null,
        testCase.input.requestCallbackData,
        (MockCodemirrorEditor as unknown) as CodeMirror.Editor,
        () => null,
      );

      expect(value.from).toEqual(testCase.expectedOutput);
    });
  });
});

describe("Tern server sorting", () => {
  const contextCompletion: Completion = {
    text: "context",
    type: "STRING",
    origin: "[doc]",
    data: {
      doc: "",
    },
  };

  const sameEntityCompletion: Completion = {
    text: "sameEntity.tableData",
    type: "ARRAY",
    origin: "DATA_TREE.WIDGET.TABLE_WIDGET.sameEntity",
    data: {
      doc: "",
    },
  };

  const sameTypeCompletion: Completion = {
    text: "sameType.selectedRow",
    type: "OBJECT",
    origin: "DATA_TREE.WIDGET.TABLE_WIDGET.sameType",
    data: {
      doc: "",
    },
  };

  const diffTypeCompletion: Completion = {
    text: "diffType.tableData",
    type: "ARRAY",
    origin: "DATA_TREE.WIDGET.TABLE_WIDGET.diffType",
    data: {
      doc: "",
    },
  };

  const sameTypeDiffEntityTypeCompletion: Completion = {
    text: "diffEntity.data",
    type: "OBJECT",
    origin: "DATA_TREE.ACTION.ACTION.diffEntity",
    data: {
      doc: "",
    },
  };

  const dataTreeCompletion: Completion = {
    text: "otherDataTree",
    type: "STRING",
    origin: "DATA_TREE.WIDGET.TEXT_WIDGET.otherDataTree",
    data: {
      doc: "",
    },
  };

  const functionCompletion: Completion = {
    text: "otherDataFunction",
    type: "FUNCTION",
    origin: "DATA_TREE.APPSMITH.FUNCTIONS",
    data: {
      doc: "",
    },
  };

  const ecmascriptCompletion: Completion = {
    text: "otherJS",
    type: "OBJECT",
    origin: "ecmascript",
    data: {
      doc: "",
    },
  };

  const libCompletion: Completion = {
    text: "libValue",
    type: "OBJECT",
    origin: "LIB/lodash",
    data: {
      doc: "",
    },
  };

  const unknownCompletion: Completion = {
    text: "unknownSuggestion",
    type: "UNKNOWN",
    origin: "unknown",
    data: {
      doc: "",
    },
  };

  const completions = [
    sameEntityCompletion,
    sameTypeCompletion,
    contextCompletion,
    libCompletion,
    unknownCompletion,
    diffTypeCompletion,
    sameTypeDiffEntityTypeCompletion,
    ecmascriptCompletion,
    functionCompletion,
    dataTreeCompletion,
  ];

  it("shows best match results", () => {
    TernServer.setEntityInformation({
      entityName: "sameEntity",
      entityType: ENTITY_TYPE.WIDGET,
      expectedType: "object",
    });
    const sortedCompletions = TernServer.sortCompletions(
      _.shuffle(completions),
      true,
      "",
    );
    expect(sortedCompletions[0]).toStrictEqual(contextCompletion);
    expect(sortedCompletions).toEqual(
      expect.arrayContaining([
        createCompletionHeader("Best Match"),
        sameTypeDiffEntityTypeCompletion,
        createCompletionHeader("Search Results"),
        dataTreeCompletion,
      ]),
    );
    expect(sortedCompletions).toEqual(
      expect.not.arrayContaining([diffTypeCompletion]),
    );
  });
});
