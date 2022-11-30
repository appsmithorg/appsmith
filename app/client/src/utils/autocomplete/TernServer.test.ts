import CodemirrorTernService, {
  AutocompleteDataType,
  Completion,
  createCompletionHeader,
  DataTreeDefEntityInformation,
} from "./CodemirrorTernService";
import { MockCodemirrorEditor } from "../../../test/__mocks__/CodeMirrorEditorMock";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { AutocompleteSorter, ScoredCompletion } from "./AutocompleteSortRules";

describe("Tern server", () => {
  it("Check whether the correct value is being sent to tern", () => {
    const testCases = [
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "{{Api.}}",
            getValue: () => "{{Api.}}",
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
            getValue: () => "a{{Api.}}",
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: "a{{Api.}}",
      },
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 10, line: 0 }),
            getLine: () => "a{{Api.}}bc",
            getValue: () => "a{{Api.}}bc",
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: "a{{Api.}}bc",
      },
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 4, line: 0 }),
            getLine: () => "a{{Api.}}",
            getValue: () => "a{{Api.}}",
          } as unknown) as CodeMirror.Doc,
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
          doc: ({
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "{{Api.}}",
            somethingSelected: () => false,
            getValue: () => "{{Api.}}",
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 0, line: 0 },
      },
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 0, line: 0 }),
            getLine: () => "{{Api.}}",
            somethingSelected: () => false,
            getValue: () => "{{Api.}}",
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 0, line: 0 },
      },
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 8, line: 0 }),
            getLine: () => "g {{Api.}}",
            somethingSelected: () => false,
            getValue: () => "g {{Api.}}",
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 4, line: 0 },
      },
      {
        input: {
          name: "test",
          doc: ({
            getCursor: () => ({ ch: 7, line: 1 }),
            getLine: () => "c{{Api.}}",
            somethingSelected: () => false,
            getValue: () => "ab\nc{{Api.}}",
          } as unknown) as CodeMirror.Doc,
          changed: null,
        },
        expectedOutput: { ch: 4, line: 0 },
      },
    ];

    testCases.forEach((testCase) => {
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
            doc: ({
              getCursor: () => ({ ch: 2, line: 0 }),
              getLine: () => "{{}}",
              somethingSelected: () => false,
              getValue: () => "{{}}",
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
            cursor: { ch: 3, line: 0 },
            doc: ({
              getCursor: () => ({ ch: 3, line: 0 }),
              getLine: () => " {{}}",
              somethingSelected: () => false,
              getValue: () => " {{}}",
            } as unknown) as CodeMirror.Doc,
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
      MockCodemirrorEditor.getDoc.mockReturnValueOnce(
        testCase.input.codeEditor.doc,
      );

      const mockAddFile = jest.fn();
      CodemirrorTernService.server.addFile = mockAddFile;

      const value: any = CodemirrorTernService.requestCallback(
        null,
        testCase.input.requestCallbackData,
        (MockCodemirrorEditor as unknown) as CodeMirror.Editor,
        () => null,
      );

      expect(mockAddFile).toBeCalled();

      expect(value.from).toEqual(testCase.expectedOutput);
    });
  });
});

describe("Tern server sorting", () => {
  const defEntityInformation: Map<
    string,
    DataTreeDefEntityInformation
  > = new Map();
  const contextCompletion: Completion = {
    text: "context",
    type: AutocompleteDataType.STRING,
    origin: "[doc]",
    data: {
      doc: "",
    },
  };

  const sameEntityCompletion: Completion = {
    text: "sameEntity.tableData",
    type: AutocompleteDataType.ARRAY,
    origin: "DATA_TREE",
    data: {
      doc: "",
    },
  };
  defEntityInformation.set("sameEntity", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET",
  });
  defEntityInformation.set("sameEntity", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET_V2",
  });

  const priorityCompletion: Completion = {
    text: "selectedRow",
    type: AutocompleteDataType.OBJECT,
    origin: "DATA_TREE",
    data: {
      doc: "",
    },
  };
  defEntityInformation.set("sameType", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET",
  });
  defEntityInformation.set("sameType", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET_V2",
  });

  const diffTypeCompletion: Completion = {
    text: "diffType.tableData",
    type: AutocompleteDataType.ARRAY,
    origin: "DATA_TREE.WIDGET",
    data: {
      doc: "",
    },
  };

  defEntityInformation.set("diffType", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET",
  });
  defEntityInformation.set("diffType", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET_V2",
  });

  const sameTypeDiffEntityTypeCompletion: Completion = {
    text: "diffEntity.data",
    type: AutocompleteDataType.OBJECT,
    origin: "DATA_TREE",
    data: {
      doc: "",
    },
  };

  defEntityInformation.set("diffEntity", {
    type: ENTITY_TYPE.ACTION,
    subType: ENTITY_TYPE.ACTION,
  });

  const dataTreeCompletion: Completion = {
    text: "otherDataTree",
    type: AutocompleteDataType.STRING,
    origin: "DATA_TREE",
    data: {
      doc: "",
    },
  };

  defEntityInformation.set("otherDataTree", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TEXT_WIDGET",
  });

  const functionCompletion: Completion = {
    text: "otherDataFunction",
    type: AutocompleteDataType.FUNCTION,
    origin: "DATA_TREE.APPSMITH.FUNCTIONS",
    data: {
      doc: "",
    },
  };

  const ecmascriptCompletion: Completion = {
    text: "otherJS",
    type: AutocompleteDataType.OBJECT,
    origin: "ecmascript",
    data: {
      doc: "",
    },
  };

  const libCompletion: Completion = {
    text: "libValue",
    type: AutocompleteDataType.OBJECT,
    origin: "LIB/lodash",
    data: {
      doc: "",
    },
  };

  const unknownCompletion: Completion = {
    text: "unknownSuggestion",
    type: AutocompleteDataType.UNKNOWN,
    origin: "unknown",
    data: {
      doc: "",
    },
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
    CodemirrorTernService.setEntityInformation({
      entityName: "sameEntity",
      entityType: ENTITY_TYPE.WIDGET,
      expectedType: AutocompleteDataType.OBJECT,
    });
    CodemirrorTernService.defEntityInformation = defEntityInformation;
    const sortedCompletions = AutocompleteSorter.sort(
      _.shuffle(completions),
      {
        entityName: "sameEntity",
        entityType: ENTITY_TYPE.WIDGET,
        expectedType: AutocompleteDataType.STRING,
      },
      {
        type: ENTITY_TYPE.WIDGET,
        subType: "TABLE_WIDGET",
      },
    );
    expect(sortedCompletions[1]).toStrictEqual(contextCompletion);
    expect(sortedCompletions).toEqual(
      expect.arrayContaining([
        createCompletionHeader("Best Match"),
        sameTypeDiffEntityTypeCompletion,
        createCompletionHeader("Search Results"),
        dataTreeCompletion,
      ]),
    );
  });

  it("tests score of completions", function() {
    AutocompleteSorter.entityDefInfo = {
      type: ENTITY_TYPE.WIDGET,
      subType: "TABLE_WIDGET",
    };
    AutocompleteSorter.currentFieldInfo = {
      entityName: "sameEntity",
      entityType: ENTITY_TYPE.WIDGET,
      expectedType: AutocompleteDataType.STRING,
    };
    //completion that matches type and is present in dataTree.
    const scoredCompletion1 = new ScoredCompletion(dataTreeCompletion);
    expect(scoredCompletion1.score).toEqual(2 ** 5 + 2 ** 4 + 2 ** 3);
    //completion that belongs to the same entity.
    const scoredCompletion2 = new ScoredCompletion(sameEntityCompletion);
    expect(scoredCompletion2.score).toEqual(-Infinity);
    //completion that is a priority.
    const scoredCompletion3 = new ScoredCompletion(priorityCompletion);
    expect(scoredCompletion3.score).toBe(2 ** 6 + 2 ** 4 + 2 ** 3);
  });
});
