import {
  bindingHintHelper,
  SqlHintHelper,
} from "components/editorComponents/CodeEditor/hintHelpers";
import { MockCodemirrorEditor } from "../../../../test/__mocks__/CodeMirrorEditorMock";
import { random } from "lodash";
import "codemirror/addon/hint/sql-hint";
import { MAX_NUMBER_OF_SQL_HINTS } from "./utils/sqlHint";

jest.mock("./codeEditorUtils", () => {
  const actualExports = jest.requireActual("./codeEditorUtils");

  return {
    __esModule: true,
    ...actualExports,
    isCursorOnEmptyToken: jest.fn(() => false),
  };
});

function generateRandomTable() {
  const table: Record<string, string> = {};

  for (let i = 0; i < 500; i++) {
    table[`T${random(0, 1000)}`] = "string";
  }

  return table;
}

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

describe("hint helpers", () => {
  describe("binding hint helper", () => {
    it("is initialized correctly", () => {
      // @ts-expect-error: Types are not available
      const helper = bindingHintHelper(MockCodemirrorEditor, {});

      expect(MockCodemirrorEditor.setOption).toBeCalled();
      expect(helper).toHaveProperty("showHint");
    });

    it("opens hint correctly", () => {
      // Setup
      interface Case {
        value: string;
        cursor: { ch: number; line: number };
        toCall: "closeHint" | "showHint";
        getLine?: string[];
      }

      const cases: Case[] = [
        { value: "ABC", cursor: { ch: 3, line: 0 }, toCall: "showHint" },
        { value: "{{ }}", cursor: { ch: 3, line: 0 }, toCall: "showHint" },
        {
          value: '{ name: "{{}}" }',
          cursor: { ch: 11, line: 0 },
          toCall: "showHint",
        },
        {
          value: '{ name: "{{}}" }',
          cursor: { ch: 12, line: 0 },
          toCall: "closeHint",
        },
        {
          value: "{somethingIsHere }}",
          cursor: { ch: 18, line: 0 },
          toCall: "closeHint",
        },
        {
          value: `{\n\tname: "{{}}"\n}`,
          getLine: ["{", `\tname: "{{}}`, "}"],
          cursor: { ch: 10, line: 1 },
          toCall: "showHint",
        },
        {
          value: "{test(",
          cursor: { ch: 1, line: 0 },
          toCall: "showHint",
        },
        {
          value: "justanystring {{}}",
          cursor: { ch: 16, line: 0 },
          toCall: "showHint",
        },
      ];

      cases.forEach((testCase) => {
        MockCodemirrorEditor.getValue.mockReturnValue(testCase.value);
        MockCodemirrorEditor.getCursor.mockReturnValue(testCase.cursor);

        if (testCase.getLine) {
          testCase.getLine.forEach((line) => {
            MockCodemirrorEditor.getLine.mockReturnValueOnce(line);
          });
        }

        MockCodemirrorEditor.getTokenAt.mockReturnValueOnce({
          type: "string",
          string: "",
        });
        MockCodemirrorEditor.getDoc.mockReturnValueOnce({
          getCursor: () => testCase.cursor,
          somethingSelected: () => false,
          getValue: () => testCase.value,
          getEditor: () => MockCodemirrorEditor,
        } as unknown as CodeMirror.Doc);
        // @ts-expect-error: Types are not available
        const helper = bindingHintHelper(MockCodemirrorEditor, {});

        // @ts-expect-error: Types are not available
        helper.showHint(MockCodemirrorEditor);
      });

      // Assert
      const showHintCount = cases.filter((c) => c.toCall === "showHint").length;

      expect(MockCodemirrorEditor.showHint).toHaveBeenCalledTimes(
        showHintCount,
      );
      const closeHintCount = cases.filter(
        (c) => c.toCall === "closeHint",
      ).length;

      expect(MockCodemirrorEditor.closeHint).toHaveBeenCalledTimes(
        closeHintCount,
      );
    });
  });

  describe("SQL hinter", () => {
    const hinter = new SqlHintHelper();
    const randomTable = generateRandomTable();

    hinter.setDatasourceTableKeys(randomTable);
    jest.spyOn(hinter, "getCompletions").mockImplementation(() => ({
      from: { line: 1, ch: 1 },
      to: { line: 1, ch: 1 },
      list: Object.keys(randomTable),
    }));

    it("returns no hint when not in SQL mode", () => {
      jest.spyOn(hinter, "isSqlMode").mockImplementationOnce(() => false);
      // @ts-expect-error: actual editor is not required
      const response = hinter.handleCompletions({});

      expect(response.completions).toBe(null);
    });

    it("returns hints when in SQL mode", () => {
      jest.spyOn(hinter, "isSqlMode").mockImplementationOnce(() => true);
      // @ts-expect-error: actual editor is not required
      const response = hinter.handleCompletions({});

      expect(response.completions?.list).toBeTruthy();
    });

    it("Doesn't return hints greater than the threshold", () => {
      jest.spyOn(hinter, "isSqlMode").mockImplementationOnce(() => true);
      // @ts-expect-error: actual editor is not required
      const response = hinter.handleCompletions({});

      expect(response.completions?.list.length).toBeLessThanOrEqual(
        MAX_NUMBER_OF_SQL_HINTS,
      );
    });
  });

  describe("XSS regression (GHSA-vjfq-fvfc-3vjw)", () => {
    // A workspace Developer who can run DDL on a shared datasource used to be
    // able to inject arbitrary JavaScript into another member's browser by
    // creating a table whose name is an HTML payload. The SQL hint renderer
    // wrote the raw identifier to `innerHTML`. These tests lock the renderer
    // to `textContent` so the payload can never be parsed as markup again.

    const HTML_PAYLOAD = '<img src=x onerror="window.__xssFired=true">';
    const SVG_PAYLOAD = '<svg onload="window.__xssFired=true"></svg>';

    beforeEach(() => {
      // @ts-expect-error test probe
      delete window.__xssFired;
    });

    function runRenderer(text: string, className: string) {
      const hinter = new SqlHintHelper();

      hinter.setDatasourceTableKeys({ [text]: "table" });

      const completions = {
        from: { line: 0, ch: 0 },
        to: { line: 0, ch: 0 },
        list: [{ text, className, displayText: text }],
      } as unknown as Parameters<
        SqlHintHelper["addCustomAttributesToCompletions"]
      >[0];

      const rendered = hinter.addCustomAttributesToCompletions(completions);
      const li = document.createElement("li") as HTMLLIElement;
      const completion = rendered.list[0] as unknown as {
        render: (
          el: HTMLLIElement,
          data: unknown,
          cur: { text: string; className: string },
        ) => void;
      };

      completion.render(li, undefined, { text, className });

      return li;
    }

    it("renders a malicious table name as text, not HTML", () => {
      const li = runRenderer(HTML_PAYLOAD, "CodeMirror-hint-table");

      expect(li.querySelector("img")).toBeNull();
      expect(li.textContent).toBe(HTML_PAYLOAD);
      // @ts-expect-error test probe
      expect(window.__xssFired).toBeUndefined();
    });

    it("renders a malicious SVG table name without creating an SVG element", () => {
      const li = runRenderer(SVG_PAYLOAD, "CodeMirror-hint-table");

      expect(li.querySelector("svg")).toBeNull();
      expect(li.textContent).toBe(SVG_PAYLOAD);
      // @ts-expect-error test probe
      expect(window.__xssFired).toBeUndefined();
    });

    it("renders a malicious table.column composite key as text", () => {
      const composite = `public.${HTML_PAYLOAD}`;
      const li = runRenderer(composite, "CodeMirror-hint-table");

      expect(li.querySelector("img")).toBeNull();
      expect(li.textContent).toBe(composite);
    });
  });
});
