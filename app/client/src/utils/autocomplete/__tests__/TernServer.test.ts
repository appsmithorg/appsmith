import type {
  Completion,
  DataTreeDefEntityInformation,
} from "../CodemirrorTernService";
import CodemirrorTernService, {
  createCompletionHeader,
  extractFinalObjectPath,
} from "../CodemirrorTernService";
import { AutocompleteDataType } from "../AutocompleteDataType";
import { MockCodemirrorEditor } from "../../../../test/__mocks__/CodeMirrorEditorMock";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { AutocompleteSorter, ScoredCompletion } from "../AutocompleteSortRules";
import type CodeMirror from "codemirror";
import type { Def } from "tern";
import type { Doc } from "codemirror";
import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";

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

      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value: any = CodemirrorTernService.requestCallback(
        null,
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    displayText: "context",
    type: AutocompleteDataType.STRING,
    origin: "[doc]",
    data: {
      doc: "",
    },
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sameEntityCompletion: Completion<any> = {
    text: "sameEntity.tableData",
    displayText: "sameEntity.tableData",
    type: AutocompleteDataType.ARRAY,
    origin: "DATA_TREE",
    data: {},
  };
  defEntityInformation.set("sameEntity", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET",
  });
  defEntityInformation.set("sameEntity", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET_V2",
  });

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priorityCompletion: Completion<any> = {
    text: "selectedRow",
    displayText: "selectedRow",
    type: AutocompleteDataType.OBJECT,
    origin: "DATA_TREE",
    data: {},
  };
  defEntityInformation.set("sameType", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET",
  });
  defEntityInformation.set("sameType", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET_V2",
  });

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diffTypeCompletion: Completion<any> = {
    text: "diffType.tableData",
    displayText: "diffType.tableData",
    type: AutocompleteDataType.ARRAY,
    origin: "DATA_TREE.WIDGET",
    data: {},
  };

  defEntityInformation.set("diffType", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET",
  });
  defEntityInformation.set("diffType", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TABLE_WIDGET_V2",
  });

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sameTypeDiffEntityTypeCompletion: Completion<any> = {
    text: "diffEntity.data",
    displayText: "diffEntity.data",
    type: AutocompleteDataType.OBJECT,
    origin: "DATA_TREE",
    data: {},
  };

  defEntityInformation.set("diffEntity", {
    type: ENTITY_TYPE.ACTION,
    subType: ENTITY_TYPE.ACTION,
  });

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataTreeCompletion: Completion<any> = {
    text: "otherDataTree",
    displayText: "otherDataTree",
    type: AutocompleteDataType.STRING,
    origin: "DATA_TREE",
    data: {},
  };

  defEntityInformation.set("otherDataTree", {
    type: ENTITY_TYPE.WIDGET,
    subType: "TEXT_WIDGET",
  });

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const functionCompletion: Completion<any> = {
    text: "otherDataFunction",
    displayText: "otherDataFunction",
    type: AutocompleteDataType.FUNCTION,
    origin: "DATA_TREE.APPSMITH.FUNCTIONS",
    data: {},
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ecmascriptCompletion: Completion<any> = {
    text: "otherJS",
    displayText: "otherJS",
    type: AutocompleteDataType.OBJECT,
    origin: "ecmascript",
    data: {},
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const libCompletion: Completion<any> = {
    text: "libValue",
    displayText: "libValue",
    type: AutocompleteDataType.OBJECT,
    origin: "LIB/lodash",
    data: {},
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unknownCompletion: Completion<any> = {
    text: "unknownSuggestion",
    displayText: "unknownSuggestion",
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
        entityType: ENTITY_TYPE.WIDGET,
        expectedType: AutocompleteDataType.OBJECT,
      },
    );
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
        createCompletionHeader("Best match"),
        sameTypeDiffEntityTypeCompletion,
        createCompletionHeader("Search results"),
        dataTreeCompletion,
      ]),
    );
  });

  it("tests score of completions", function () {
    AutocompleteSorter.entityDefInfo = {
      type: ENTITY_TYPE.WIDGET,
      subType: "TABLE_WIDGET",
    };
    AutocompleteSorter.currentFieldInfo = {
      entityName: "sameEntity",
      entityType: ENTITY_TYPE.WIDGET,
      expectedType: AutocompleteDataType.STRING,
      propertyPath: "tableData",
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

describe("Tern server completion", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it("identifies fnParams for the current line and applies to the completion list", () => {
    const entityDef: Def = {
      "!name": "DATA_TREE",
      QueryModule11: {
        "!doc":
          "Object that contains the properties required to run queries and access the query data.",
        "!url":
          "https://docs.appsmith.com/reference/appsmith-framework/query-object",
        data: {
          "!doc":
            "A read-only property that contains the response body from the last successful execution of this query.",
          "!url":
            "https://docs.appsmith.com/reference/appsmith-framework/query-object#data-array",
          "!type": "?",
        },
        run: {
          "!type":
            "fn(inputs: {gender: any, limit: any, name: any }) -> +Promise",
          "!fnParams":
            '{ gender: "male", limit: "5", name: "Mr. " + appsmith.user.name }',
          "!url":
            "https://docs.appsmith.com/reference/appsmith-framework/query-object#queryrun",
          "!doc": "Executes the query with the given input values.",
        },
      },
      "QueryModule11.data": {
        "!doc":
          "A read-only property that contains the response body from the last successful execution of this query.",
        "!url":
          "https://docs.appsmith.com/reference/appsmith-framework/query-object#data-array",
        "!type": "?",
      },
      "QueryModule11.run": {
        "!type": "fn(inputs: {gender: any, limit: any}) -> +Promise",
        "!fnParams":
          '{ gender: "male", limit: "5", name: "Mr. " + appsmith.user.name }',
        "!url":
          "https://docs.appsmith.com/reference/appsmith-framework/query-object#queryrun",
        "!doc": "Executes the query with the given input values.",
      },
      "!define": {},
    };
    const data = {
      start: {
        line: 10,
        ch: 22,
      },
      end: {
        line: 10,
        ch: 30,
      },
      isProperty: false,
      isObjectKey: false,
      completions: [
        {
          name: "QueryModule11",
          type: "QueryModule11",
          doc: "Object that contains the properties required to run queries and access the query data.",
          url: "https://docs.appsmith.com/reference/appsmith-framework/query-object",
          origin: "DATA_TREE",
        },
        {
          name: "QueryModule11.data",
          type: "?",
          doc: "A read-only property that contains the response body from the last successful execution of this query.",
          url: "https://docs.appsmith.com/reference/appsmith-framework/query-object#data-array",
          origin: "DATA_TREE",
        },
        {
          name: "QueryModule11.run",
          type: "fn(inputs: {gender: ?, limit: ?, name: ?}) -> Promise",
          doc: "Executes the query with the given input values.",
          url: "https://docs.appsmith.com/reference/appsmith-framework/query-object#queryrun",
          origin: "DATA_TREE",
        },
      ],
    };

    const expectedValue = [
      {
        text: "QueryModule11.data",
        displayText: "QueryModule11.data",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-unknown",
        data: {
          name: "QueryModule11.data",
          type: "?",
          doc: "A read-only property that contains the response body from the last successful execution of this query.",
          url: "https://docs.appsmith.com/reference/appsmith-framework/query-object#data-array",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "UNKNOWN",
        isHeader: false,
        recencyWeight: 0,
        isEntityName: false,
      },
      {
        text: "QueryModule11",
        displayText: "QueryModule11",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-object",
        data: {
          name: "QueryModule11",
          type: "QueryModule11",
          doc: "Object that contains the properties required to run queries and access the query data.",
          url: "https://docs.appsmith.com/reference/appsmith-framework/query-object",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "OBJECT",
        isHeader: false,
        recencyWeight: 0,
        isEntityName: true,
      },
      {
        text: 'QueryModule11.run({ gender: "male", limit: "5", name: "Mr. " + appsmith.user.name })',
        displayText: "QueryModule11.run",
        className: "CodeMirror-Tern-completion CodeMirror-Tern-completion-fn",
        data: {
          name: "QueryModule11.run",
          type: "fn(inputs: {gender: ?, limit: ?, name: ?}) -> Promise",
          doc: "Executes the query with the given input values.",
          url: "https://docs.appsmith.com/reference/appsmith-framework/query-object#queryrun",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "FUNCTION",
        isHeader: false,
        recencyWeight: 0,
        isEntityName: false,
      },
    ];

    const mockToken = {
      start: 22,
      end: 30,
      string: "QueryMod",
      type: "variable",
      state: {
        lastType: "variable",
        cc: [
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ],
        lexical: {
          indented: 4,
          column: 4,
          type: "vardef",
          prev: {
            indented: 2,
            column: 18,
            type: "}",
            prev: {
              indented: 0,
              column: 15,
              type: "}",
              prev: {
                indented: 0,
                column: 0,
                type: "stat",
                prev: {
                  indented: -2,
                  column: 0,
                  type: "block",
                  align: false,
                },
                align: true,
              },
              info: null,
              align: false,
            },
            align: false,
          },
          info: "const",
          align: true,
        },
        localVars: {
          name: "users",
          next: null,
        },
        context: {
          prev: {
            block: false,
          },
          vars: {
            name: "this",
            next: {
              name: "arguments",
              next: null,
            },
          },
          block: true,
        },
        indented: 4,
      },
    };

    const fieldEntityInformation = {
      mode: "javascript",
      isTriggerPath: true,
      entityName: "JSObject1",
      propertyPath: "body",
      entityType: "JSACTION",
      blockCompletions: [
        {
          parentPath: "this",
          subPath: "myFun2()",
        },
        {
          parentPath: "JSObject1",
          subPath: "myFun2()",
        },
      ],
      token: mockToken,
    } as FieldEntityInformation;

    // The current cursor location that is being written in the code mirror editor
    MockCodemirrorEditor.getCursor.mockResolvedValue({
      line: 10,
      ch: 30,
      sticky: null,
    });
    MockCodemirrorEditor.getTokenAt.mockResolvedValue(mockToken);
    CodemirrorTernService.fieldEntityInformation = fieldEntityInformation;
    CodemirrorTernService.entityDef = entityDef;

    // The current line that is being written in the code mirror editor
    jest
      .spyOn(CodemirrorTernService, "lineValue")
      .mockReturnValue("\t\tconst users = await QueryMod");
    jest
      .spyOn(CodemirrorTernService, "getFocusedDocValueAndPos")
      .mockReturnValue({
        extraChars: 0,
        value: "",
        end: {
          line: 10,
          ch: 30,
        },
      });
    jest.spyOn(CodemirrorTernService, "findDoc").mockReturnValue({
      doc: {} as Doc,
      name: "",
      changed: null,
    });

    CodemirrorTernService.defEntityInformation = new Map([
      [
        "QueryModule11",
        {
          type: "MODULE_INSTANCE",
          subType: "QUERY_MODULE",
        },
      ],
    ]);

    const result = CodemirrorTernService.requestCallback(
      null,
      data,
      MockCodemirrorEditor as unknown as CodeMirror.Editor,
      jest.fn,
    )!;

    const expectedContainingItems = _.sortBy(expectedValue, "text").map(
      (item) => expect.objectContaining(item),
    );
    expect(_.sortBy(result.list, "text")).toEqual(expectedContainingItems);
  });
});

describe("extractFinalObjectPath", () => {
  it("should extract the last dot-separated path from a string", () => {
    expect(extractFinalObjectPath("user.profile.name")).toEqual(
      "user.profile.name",
    );
    expect(extractFinalObjectPath("app.data")).toEqual("app.data");
  });

  it("should return the last path in a code line", () => {
    expect(extractFinalObjectPath("const users = GetUsers.run")).toEqual(
      "GetUsers.run",
    );
  });

  it("should return the input if there are no dots", () => {
    expect(extractFinalObjectPath("username")).toEqual("username");
  });

  it("should return null for empty or whitespace-only strings", () => {
    expect(extractFinalObjectPath("")).toBeNull();
    expect(extractFinalObjectPath("   ")).toBeNull();
  });

  it("should handle strings with leading and trailing whitespace", () => {
    expect(extractFinalObjectPath("  user.profile.name  ")).toEqual(
      "user.profile.name",
    );
  });

  it("should return null if no valid path is found", () => {
    expect(extractFinalObjectPath("This is a valid code string path")).toEqual(
      "path",
    );
  });
});
