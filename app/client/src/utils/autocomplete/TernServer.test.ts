import TernServer, { Completion } from "./TernServer";
import { MockCodemirrorEditor } from "../../../test/__mocks__/CodeMirrorEditorMock";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

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
  const completions: Completion[] = [
    {
      text: "sameType",
      type: "OBJECT",
      origin: "DATA_TREE.WIDGET.TABLE_WIDGET.Table1",
      data: {
        doc: "",
      },
    },
    {
      text: "diffType",
      type: "ARRAY",
      origin: "DATA_TREE.WIDGET.TABLE_WIDGET.Table1",
      data: {
        doc: "",
      },
    },
    {
      text: "diffEntity",
      type: "OBJECT",
      origin: "DATA_TREE.ACTION.ACTION.API1",
      data: {
        doc: "",
      },
    },
    {
      text: "otherDataTree",
      type: "STRING",
      origin: "DATA_TREE.WIDGET.TEXT_WIDGET.Text1",
      data: {
        doc: "",
      },
    },
    {
      text: "otherJS",
      type: "OBJECT",
      origin: "ecma",
      data: {
        doc: "",
      },
    },
    {
      text: "context",
      type: "STRING",
      origin: "[doc]",
      data: {
        doc: "",
      },
    },
    {
      text: "libValue",
      type: "OBJECT",
      origin: "lodash",
      data: {
        doc: "",
      },
    },
    {
      text: "unknownSuggestion",
      type: "UNKNOWN",
      origin: "unknown",
      data: {
        doc: "",
      },
    },
  ];

  it("shows best match results", () => {
    TernServer.setEntityInformation({
      entityName: "Table2",
      entityType: ENTITY_TYPE.WIDGET,
      expectedType: "object",
    });
    const sortedCompletions = TernServer.sortCompletions(completions, true, "");
    expect(sortedCompletions).toStrictEqual({});
  });
});
