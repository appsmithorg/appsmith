import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { AutocompleteSorter } from "../AutocompleteSortRules";
import type {
  Completion,
  DataTreeDefEntityInformation,
  TernCompletionResult,
} from "../CodemirrorTernService";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";

describe("Autocomplete Ranking", () => {
  it("Blocks platform functions in data fields", () => {
    const completions: unknown[] = [
      {
        text: "appsmith",
        displayText: "appsmith",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-object",
        data: {
          name: "appsmith",
          type: "appsmith",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "OBJECT",
        isHeader: false,
      },
      {
        text: "atob()",
        displayText: "atob()",
        className: "CodeMirror-Tern-completion CodeMirror-Tern-completion-fn",
        data: {
          name: "atob",
          type: "fn(bString: string) -> string",
          doc: "decodes a base64 encoded string",
          origin: "base64-js",
        },
        origin: "base64-js",
        type: "FUNCTION",
        isHeader: false,
      },
      {
        text: "APIQuery",
        displayText: "APIQuery",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-object",
        data: {
          name: "APIQuery",
          type: "APIQuery",
          doc: "Actions allow you to connect your widgets to your backend data in a secure manner.",
          url: "https://docs.appsmith.com/reference/appsmith-framework/query-object",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "OBJECT",
        isHeader: false,
      },
      {
        text: "APIQuery.clear()",
        displayText: "APIQuery.clear()",
        className: "CodeMirror-Tern-completion CodeMirror-Tern-completion-fn",
        data: {
          name: "APIQuery.clear",
          type: "fn()",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "FUNCTION",
        isHeader: false,
      },
      {
        text: "APIQuery.data",
        displayText: "APIQuery.data",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-unknown",
        data: {
          name: "APIQuery.data",
          type: "?",
          doc: "The response of the action",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "UNKNOWN",
        isHeader: false,
      },
      {
        text: "APIQuery.run()",
        displayText: "APIQuery.run()",
        className: "CodeMirror-Tern-completion CodeMirror-Tern-completion-fn",
        data: {
          name: "APIQuery.run",
          type: "fn(params: ?)",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "FUNCTION",
        isHeader: false,
      },
      {
        text: "Array()",
        displayText: "Array()",
        className: "CodeMirror-Tern-completion CodeMirror-Tern-completion-fn",
        data: {
          name: "Array",
          type: "fn(size: number)",
          doc: "The JavaScript Array global object is a constructor for arrays, which are high-level, list-like objects.",
          url: "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array",
          origin: "ecmascript",
        },
        origin: "ecmascript",
        type: "FUNCTION",
        isHeader: false,
      },
      {
        text: "showAlert()",
        displayText: "showAlert()",
        className: "CodeMirror-Tern-completion CodeMirror-Tern-completion-fn",
        data: {
          name: "showAlert",
          type: "fn(message: string, style: string)",
          doc: "Show a temporary notification style message to the user",
          origin: "DATA_TREE.APPSMITH.FUNCTIONS",
        },
        origin: "DATA_TREE.APPSMITH.FUNCTIONS",
        type: "FUNCTION",
        isHeader: false,
      },
    ];
    const currentFieldInfo: unknown = {
      expectedType: "ARRAY",
      example: '[{ "name": "John" }]',
      mode: "text-js",
      entityName: "Table1",
      entityType: "WIDGET",
      entityId: "xy1ezsr0l5",
      widgetType: "TABLE_WIDGET_V2",
      propertyPath: "tableData",
      token: {
        start: 2,
        end: 3,
        string: "A",
        type: "variable",
        state: {
          outer: true,
          innerActive: {
            open: "{{",
            close: "}}",
            delimStyle: "binding-brackets",
            mode: {
              electricInput: {},
              blockCommentStart: null,
              blockCommentEnd: null,
              blockCommentContinue: null,
              lineComment: null,
              fold: "brace",
              closeBrackets: "()[]{}''\"\"``",
              helperType: "json",
              jsonMode: true,
              name: "javascript",
            },
          },
          inner: {
            lastType: "variable",
            cc: [null],
            lexical: {
              indented: -2,
              column: 0,
              type: "block",
              align: false,
            },
            indented: 0,
          },
          startingInner: false,
        },
      },
    };
    const entityInfo: DataTreeDefEntityInformation = {
      type: ENTITY_TYPE.WIDGET,
      subType: "TABLE_WIDGET_V2",
    };
    const sortedCompletionsText = AutocompleteSorter.sort(
      completions as Completion<TernCompletionResult>[],
      currentFieldInfo as FieldEntityInformation,
      entityInfo,
      true,
    ).map((c) => c.displayText);

    expect(sortedCompletionsText).not.toEqual(
      expect.arrayContaining(["showAlert(), APIQuery.clear(), APIQuery.run()"]),
    );
  });
  it("Blocks self reference of entity", () => {
    const completions: unknown[] = [
      {
        text: "appsmith",
        displayText: "appsmith",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-object",
        data: {
          name: "appsmith",
          type: "appsmith",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "OBJECT",
        isHeader: false,
      },
      {
        text: "Table1",
        displayText: "Table1",
        isEntityName: true,
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-object",
        data: {
          name: "Table1",
          type: "Table1",
          doc: "Table widget",
          url: "https://docs.appsmith.com/reference/appsmith-framework/query-object",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "OBJECT",
        isHeader: false,
      },
      {
        text: "Table2.updatedRows",
        displayText: "Table2.updatedRows",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-array",
        data: {
          name: "Table2.updatedRows",
          type: "[?]",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "ARRAY",
        isHeader: false,
        recencyWeight: 2,
        isEntityName: false,
      },
      {
        text: "Table2.updatedRowIndices",
        displayText: "Table2.updatedRowIndices",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-array",
        data: {
          name: "Table2.updatedRowIndices",
          type: "[?]",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "ARRAY",
        isHeader: false,
        recencyWeight: 2,
        isEntityName: false,
      },
      {
        text: "Table2.updatedRow",
        displayText: "Table2.updatedRow",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-object",
        data: {
          name: "Table2.updatedRow",
          type: "Table2.updatedRow",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "OBJECT",
        isHeader: false,
        recencyWeight: 2,
        isEntityName: false,
      },
      {
        text: "Table2.tableData",
        displayText: "Table2.tableData",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-array",
        data: {
          name: "Table2.tableData",
          type: "[?]",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "ARRAY",
        isHeader: false,
        recencyWeight: 2,
        isEntityName: false,
      },
      {
        text: "Query1.data",
        displayText: "Query1.data",
        className:
          "CodeMirror-Tern-completion CodeMirror-Tern-completion-unknown",
        data: {
          name: "Query1.data",
          type: "[?]",
          doc: "The response of the action",
          origin: "DATA_TREE",
        },
        origin: "DATA_TREE",
        type: "ARRAY",
        isHeader: false,
      },
    ];
    const currentFieldInfo: unknown = {
      expectedType: "ARRAY",
      example: '[{ "name": "John" }]',
      mode: "text-js",
      entityName: "Table2",
      entityType: "WIDGET",
      entityId: "xy1ezsr0l5",
      widgetType: "TABLE_WIDGET_V2",
      propertyPath: "tableData",
      token: {
        start: 2,
        end: 4,
        string: "Ta",
        type: "variable",
        state: {
          outer: true,
          innerActive: {
            open: "{{",
            close: "}}",
            delimStyle: "binding-brackets",
            mode: {
              electricInput: {},
              blockCommentStart: null,
              blockCommentEnd: null,
              blockCommentContinue: null,
              lineComment: null,
              fold: "brace",
              closeBrackets: "()[]{}''\"\"``",
              helperType: "json",
              jsonMode: true,
              name: "javascript",
            },
          },
          inner: {
            lastType: "variable",
            cc: [null],
            lexical: {
              indented: -2,
              column: 0,
              type: "block",
              align: false,
            },
            indented: 0,
          },
          startingInner: false,
        },
      },
    };
    const entityInfo: DataTreeDefEntityInformation = {
      type: ENTITY_TYPE.WIDGET,
      subType: "TABLE_WIDGET_V2",
    };
    const sortedCompletionsText = AutocompleteSorter.sort(
      completions as Completion<TernCompletionResult>[],
      currentFieldInfo as FieldEntityInformation,
      entityInfo,
      true,
    )
      .filter((c) => !c.isHeader)
      .map((c) => c.displayText);

    expect(sortedCompletionsText).toEqual([
      "Query1.data",
      "Table2.updatedRowIndices",
      "Table2.updatedRows",
      "appsmith",
      "Table2.updatedRow",
    ]);
  });
});
