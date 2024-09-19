import CodeMirror from "codemirror";
import "components/editorComponents/CodeEditor/modes";
import "codemirror/addon/comment/comment";
import { EditorModes } from "../EditorConfig";
import { handleCodeComment } from "./codeComment";

const JS_LINE_COMMENT = "//";
const SQL_LINE_COMMENT = "--";

describe("handleCodeComment", () => {
  it("should handle code comment for single line", () => {
    const editor = CodeMirror(document.body, { mode: EditorModes.JAVASCRIPT });

    const code = `const a = 1;`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`// const a = 1;`);
  });

  it("should handle code comment for multiple lines", () => {
    const editor = CodeMirror(document.body, { mode: EditorModes.JAVASCRIPT });

    const code = `const a = 1;
      const b = 2;`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`// const a = 1;
      // const b = 2;`);
  });

  it("should handle code uncomment for multiple lines", () => {
    const editor = CodeMirror(document.body, { mode: EditorModes.JAVASCRIPT });

    const code = `// const a = 1;
      // const b = 2;`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`const a = 1;
      const b = 2;`);
  });

  it("should handle code comment for multiple lines in between", () => {
    const editor = CodeMirror(document.body, { mode: EditorModes.JAVASCRIPT });

    const code = `const a = 1;
      const b = 2;
      const c = 3;
      const d = 4;`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection({ line: 1, ch: 0 }, { line: 3, ch: 0 });

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`const a = 1;
      // const b = 2;
      // const c = 3;
      const d = 4;`);
  });

  it("should not code comment for JS fields with plain text only", () => {
    const editor = CodeMirror(document.body, {
      mode: EditorModes.TEXT_WITH_BINDING,
    });

    const code = `hello world`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`hello world`);
  });

  it("should handle code uncomment for JS fields with plain text", () => {
    const editor = CodeMirror(document.body, {
      mode: EditorModes.TEXT_WITH_BINDING,
    });

    const code = `// hello world`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`hello world`);
  });

  it("should handle code comment in JS fields with single line", () => {
    const editor = CodeMirror(document.body, { mode: EditorModes.JAVASCRIPT });

    const code = `{{ appsmith.store.id }}`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`{{//  appsmith.store.id }}`);
  });

  it("should handle code comment in JS fields with text", () => {
    const editor = CodeMirror(document.body, {
      mode: EditorModes.JAVASCRIPT,
    });

    const code = `Hello {{ appsmith.store.id }}`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`Hello {{//  appsmith.store.id }}`);
  });

  it("should handle code uncomment in JS fields with text", () => {
    const editor = CodeMirror(document.body, {
      mode: EditorModes.JAVASCRIPT,
    });

    const code = `Hello {{//  appsmith.store.id }}`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`Hello {{ appsmith.store.id }}`);
  });

  it("should handle code comment in TEXT_WITH_BINDING fields with text", () => {
    const editor = CodeMirror(document.body, {
      mode: EditorModes.TEXT_WITH_BINDING,
    });

    const code = `"label": {{ appsmith.store.id }}`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`"label": {{//  appsmith.store.id }}`);
  });

  it("should handle code comment in TEXT_WITH_BINDING fields with text in multiple lines", () => {
    const editor = CodeMirror(document.body, {
      mode: EditorModes.TEXT_WITH_BINDING,
    });

    const code = `"label": {{ 2
      + 2 }}`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 1, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`"label": {{ 2
      // + 2 }}`);
  });

  it("should handle code comment in JS fields with multiple lines", () => {
    const editor = CodeMirror(document.body, { mode: EditorModes.JAVASCRIPT });

    const code = `  {{  (() => {
      const a = "hello";
      return "Text";
    })()}}`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`  {{//   (() => {
      // const a = "hello";
      // return "Text";
    // })()}}`);
  });

  it("should handle code uncomment in JS fields with multiple lines", () => {
    const editor = CodeMirror(document.body, { mode: EditorModes.JAVASCRIPT });

    const code = `  {{// (() => {
      // const a = "hello";
      // return "Text";
    // })()}}`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(JS_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`  {{(() => {
      const a = "hello";
      return "Text";
    })()}}`);
  });

  it("should handle code comment for SQL queries", () => {
    const editor = CodeMirror(document.body, {
      mode: EditorModes.SQL,
    });

    const code = `Select * from users;`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(SQL_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(`-- Select * from users;`);
  });

  it("should handle code comment for SQL queries with JS bindings when cursor is placed outside JS bindings", () => {
    const editor = CodeMirror(document.body, {
      mode: EditorModes.SQL,
    });

    const code = `Select * from users where name={{Select.selectedOptionValue}};`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(SQL_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(
      `-- Select * from users where name={{Select.selectedOptionValue}};`,
    );
  });

  it("should handle code comment for SQL queries with JS bindings when cursor is placed inside JS bindings", () => {
    const editor = CodeMirror(document.body, {
      mode: EditorModes.SQL,
    });

    const code = `Select * from users where name={{Select.selectedOptionValue}};`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 18 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(SQL_LINE_COMMENT)(editor);

    expect(editor.getValue()).toEqual(
      `-- Select * from users where name={{Select.selectedOptionValue}};`,
    );
  });
});
