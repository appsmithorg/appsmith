import type {
  Completion,
  DataTreeDefEntityInformation,
} from "../CodemirrorTernService";
import CodemirrorTernService, {
  createCompletionHeader,
} from "../CodemirrorTernService";
import { AutocompleteDataType } from "../AutocompleteDataType";
import { MockCodemirrorEditor } from "../../../../test/__mocks__/CodeMirrorEditorMock";
import { ENTITY_TYPE_VALUE } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { AutocompleteSorter, ScoredCompletion } from "../AutocompleteSortRules";
import type CodeMirror from "codemirror";

jest.mock("utils/getCodeMirrorNamespace", () => {
  const actual = jest.requireActual("utils/getCodeMirrorNamespace");
  return {
    ...actual,
    getCodeMirrorNamespaceFromDoc: jest.fn((doc) => ({
      ...actual.getCodeMirrorNamespaceFromDoc(doc),
      innerMode: jest.fn(() => ({
        mode: {
          name: "",
        },
        state: {
          lexical: {},
        },
      })),
    })),
  };
});

describe("Tern server", () => {
  it("Check whether the correct value is being sent to tern", () => {
    const testCases = [
      {
        input: {
          name: "test",
          doc: {
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "{{Api.}}",
            getValue: () => "{{Api.}}",
          } as unknown as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: "{{Api.}}",
      },
      {
        input: {
          name: "test",
          doc: {
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "a{{Api.}}",
            getValue: () => "a{{Api.}}",
          } as unknown as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: "a{{Api.}}",
      },
      {
        input: {
          name: "test",
          doc: {
            getCursor: () => ({ ch: 10, line: 0 }),
            getLine: () => "a{{Api.}}bc",
            getValue: () => "a{{Api.}}bc",
          } as unknown as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: "a{{Api.}}bc",
      },
      {
        input: {
          name: "test",
          doc: {
            getCursor: () => ({ ch: 4, line: 0 }),
            getLine: () => "a{{Api.}}",
            getValue: () => "a{{Api.}}",
          } as unknown as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: "Api.",
      },
    ];

    testCases.forEach((testCase) => {
      const { value } = CodemirrorTernService.getFocusedDocValueAndPos(
        testCase.input,
      );
      expect(value).toBe(testCase.expectedOutput);
    });
  });

  it("Check whether the correct position is sent for querying autocomplete", () => {
    const testCases = [
      {
        input: {
          name: "test",
          doc: {
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "{{Api.}}",
            somethingSelected: () => false,
            getValue: () => "{{Api.}}",
          } as unknown as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 0, line: 0 },
      },
      {
        input: {
          name: "test",
          doc: {
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "{{Api.}}",
            somethingSelected: () => false,
            getValue: () => "{{Api.}}",
          } as unknown as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 0, line: 0 },
      },
      {
        input: {
          name: "test",
          doc: {
            getCursor: () => ({ ch: 8, line: 0 }),
            getLine: () => "g {{Api.}}",
            somethingSelected: () => false,
            getValue: () => "g {{Api.}}",
          } as unknown as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 4, line: 0 },
      },
      {
        input: {
          name: "test",
          doc: {
            getCursor: () => ({ ch: 7, line: 1 }),
            getLine: () => "c{{Api.}}",
            somethingSelected: () => false,
            getValue: () => "ab\nc{{Api.}}",
          } as unknown as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 4, line: 0 },
      },
    ];

    testCases.forEach((testCase) => {
      MockCodemirrorEditor.getTokenAt.mockReturnValueOnce({
        type: "string",
        string: "",
      });
      const request = CodemirrorTernService.buildRequest(testCase.input, {});
      expect(request.query.end).toEqual(testCase.expectedOutput);
    });
  });

  it(`Check whether the position is evaluated correctly for placing the selected autocomplete value`, () => {
    const testCases = [
      {
        input: {
          codeEditor: {
            value: "{{}}",
            cursor: { ch: 2, line: 0 },
            doc: {
              getCursor: () => ({ ch: 2, line: 0 }),
              getLine: () => "{{}}",
              somethingSelected: () => false,
              getValue: () => "{{}}",
              getEditor: () => MockCodemirrorEditor,
            } as unknown as CodeMirror.Doc,
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
            cursor: { ch: 3, line: 0 },
            doc: {
              getCursor: () => ({ ch: 3, line: 0 }),
              getLine: () => " {{}}",
              somethingSelected: () => false,
              getValue: () => " {{}}",
              getEditor: () => MockCodemirrorEditor,
            } as unknown as CodeMirror.Doc,
          },
          requestCallbackData: {
            completions: [{ name: "Api1" }],
            start: { ch: 0, line: 0 },
            end: { ch: 4, line: 0 },
          },
        },
        expectedOutput: { ch: 3, line: 0 },
      },
    ];

    testCases.forEach((testCase) => {
      MockCodemirrorEditor.getValue.mockReturnValueOnce(
        testCase.input.codeEditor.value,
      );
      MockCodemirrorEditor.getCursor.mockReturnValueOnce(
        testCase.input.codeEditor.cursor,
      );
      MockCodemirrorEditor.getDoc.mockReturnValue(
        testCase.input.codeEditor.doc,
      );
      MockCodemirrorEditor.getTokenAt.mockReturnValueOnce({
        type: "string",
        string: "",
      });

      const mockAddFile = jest.fn();
      CodemirrorTernService.server.addFile = mockAddFile;

      const value: any = CodemirrorTernService.requestCallback(
        null,
        testCase.input.requestCallbackData as any,
        MockCodemirrorEditor as unknown as CodeMirror.Editor,
        () => null,
      );

      expect(mockAddFile).toBeCalled();

      expect(value.from).toEqual(testCase.expectedOutput);
    });
  });
});

describe("Tern server sorting", () => {
  const defEntityInformation: Map<string, DataTreeDefEntityInformation> =
    new Map();
  const contextCompletion: Completion = {
    text: "context",
    type: AutocompleteDataType.STRING,
    origin: "[doc]",
    data: {
      doc: "",
    },
  };

  const sameEntityCompletion: Completion<any> = {
    text: "sameEntity.tableData",
    type: AutocompleteDataType.ARRAY,
    origin: "DATA_TREE",
    data: {},
  };
  defEntityInformation.set("sameEntity", {
    type: ENTITY_TYPE_VALUE.WIDGET,
    subType: "TABLE_WIDGET",
  });
  defEntityInformation.set("sameEntity", {
    type: ENTITY_TYPE_VALUE.WIDGET,
    subType: "TABLE_WIDGET_V2",
  });

  const priorityCompletion: Completion<any> = {
    text: "selectedRow",
    type: AutocompleteDataType.OBJECT,
    origin: "DATA_TREE",
    data: {},
  };
  defEntityInformation.set("sameType", {
    type: ENTITY_TYPE_VALUE.WIDGET,
    subType: "TABLE_WIDGET",
  });
  defEntityInformation.set("sameType", {
    type: ENTITY_TYPE_VALUE.WIDGET,
    subType: "TABLE_WIDGET_V2",
  });

  const diffTypeCompletion: Completion<any> = {
    text: "diffType.tableData",
    type: AutocompleteDataType.ARRAY,
    origin: "DATA_TREE.WIDGET",
    data: {},
  };

  defEntityInformation.set("diffType", {
    type: ENTITY_TYPE_VALUE.WIDGET,
    subType: "TABLE_WIDGET",
  });
  defEntityInformation.set("diffType", {
    type: ENTITY_TYPE_VALUE.WIDGET,
    subType: "TABLE_WIDGET_V2",
  });

  const sameTypeDiffEntityTypeCompletion: Completion<any> = {
    text: "diffEntity.data",
    type: AutocompleteDataType.OBJECT,
    origin: "DATA_TREE",
    data: {},
  };

  defEntityInformation.set("diffEntity", {
    type: ENTITY_TYPE_VALUE.ACTION,
    subType: ENTITY_TYPE_VALUE.ACTION,
  });

  const dataTreeCompletion: Completion<any> = {
    text: "otherDataTree",
    type: AutocompleteDataType.STRING,
    origin: "DATA_TREE",
    data: {},
  };

  defEntityInformation.set("otherDataTree", {
    type: ENTITY_TYPE_VALUE.WIDGET,
    subType: "TEXT_WIDGET",
  });

  const functionCompletion: Completion<any> = {
    text: "otherDataFunction",
    type: AutocompleteDataType.FUNCTION,
    origin: "DATA_TREE.APPSMITH.FUNCTIONS",
    data: {},
  };

  const ecmascriptCompletion: Completion<any> = {
    text: "otherJS",
    type: AutocompleteDataType.OBJECT,
    origin: "ecmascript",
    data: {},
  };

  const libCompletion: Completion<any> = {
    text: "libValue",
    type: AutocompleteDataType.OBJECT,
    origin: "LIB/lodash",
    data: {},
  };

  const unknownCompletion: Completion<any> = {
    text: "unknownSuggestion",
    type: AutocompleteDataType.UNKNOWN,
    origin: "unknown",
    data: {},
  };

  const completions = [
    sameEntityCompletion,
    priorityCompletion,
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
    CodemirrorTernService.setEntityInformation(
      MockCodemirrorEditor as unknown as CodeMirror.Editor,
      {
        entityName: "sameEntity",
        entityType: ENTITY_TYPE_VALUE.WIDGET,
        expectedType: AutocompleteDataType.OBJECT,
      },
    );
    CodemirrorTernService.defEntityInformation = defEntityInformation;
    const sortedCompletions = AutocompleteSorter.sort(
      _.shuffle(completions),
      {
        entityName: "sameEntity",
        entityType: ENTITY_TYPE_VALUE.WIDGET,
        expectedType: AutocompleteDataType.STRING,
      },
      {
        type: ENTITY_TYPE_VALUE.WIDGET,
        subType: "TABLE_WIDGET",
      },
    );
    expect(sortedCompletions[1]).toStrictEqual(contextCompletion);
    expect(sortedCompletions).toEqual(
      expect.arrayContaining([
        createCompletionHeader("Best match"),
        sameTypeDiffEntityTypeCompletion,
        createCompletionHeader("Search results"),
        dataTreeCompletion,
      ]),
    );
  });

  it("tests score of completions", function () {
    AutocompleteSorter.entityDefInfo = {
      type: ENTITY_TYPE_VALUE.WIDGET,
      subType: "TABLE_WIDGET",
    };
    AutocompleteSorter.currentFieldInfo = {
      entityName: "sameEntity",
      entityType: ENTITY_TYPE_VALUE.WIDGET,
      expectedType: AutocompleteDataType.STRING,
    };
    //completion that matches type and is present in dataTree.
    const scoredCompletion1 = new ScoredCompletion(
      dataTreeCompletion,
      AutocompleteSorter.currentFieldInfo,
    );
    expect(scoredCompletion1.score).toEqual(2 ** 6 + 2 ** 4 + 2 ** 3);
    //completion that belongs to the same entity.
    const scoredCompletion2 = new ScoredCompletion(
      sameEntityCompletion,
      AutocompleteSorter.currentFieldInfo,
    );
    expect(scoredCompletion2.score).toEqual(-Infinity);
    //completion that is a priority.
    const scoredCompletion3 = new ScoredCompletion(
      priorityCompletion,
      AutocompleteSorter.currentFieldInfo,
    );
    expect(scoredCompletion3.score).toBe(2 ** 8 + 2 ** 4 + 2 ** 3);
  });
});
