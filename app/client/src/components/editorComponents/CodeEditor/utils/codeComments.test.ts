import CodeMirror from "codemirror";
import "codemirror/addon/comment/comment";
import { handleCodeComment } from "./codeComment";

describe("handleCodeComment", () => {
  it("should handle code comment for single line", () => {
    const editor = CodeMirror(document.body, { mode: "javascript" });

    const code = `const a = 1;`;
    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(editor);

    expect(editor.getValue()).toEqual(`// const a = 1;`);
  });

  it("should handle code comment for multiple lines", () => {
    const editor = CodeMirror(document.body, { mode: "javascript" });

    const code = `const a = 1;
      const b = 2;`;
    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(editor);

    expect(editor.getValue()).toEqual(`// const a = 1;
      // const b = 2;`);
  });

  it("should handle code uncomment for multiple lines", () => {
    const editor = CodeMirror(document.body, { mode: "javascript" });

    const code = `// const a = 1;
      // const b = 2;`;
    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(editor);

    expect(editor.getValue()).toEqual(`const a = 1;
      const b = 2;`);
  });

  it("should handle code comment for multiple lines in between", () => {
    const editor = CodeMirror(document.body, { mode: "javascript" });

    const code = `const a = 1;
      const b = 2;
      const c = 3;
      const d = 4;`;
    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection({ line: 1, ch: 0 }, { line: 3, ch: 0 });

    handleCodeComment(editor);

    expect(editor.getValue()).toEqual(`const a = 1;
      // const b = 2;
      // const c = 3;
      const d = 4;`);
  });

  it("should handle code comment for JS fields with plain text", () => {
    const editor = CodeMirror(document.body, { mode: "text" });

    const code = `hello world`;
    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(editor);

    expect(editor.getValue()).toEqual(`// hello world`);
  });

  it("should handle code uncomment for JS fields with plain text", () => {
    const editor = CodeMirror(document.body, { mode: "text" });

    const code = `// hello world`;
    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(editor);

    expect(editor.getValue()).toEqual(`hello world`);
  });

  it("should handle code comment in JS fields with single line", () => {
    const editor = CodeMirror(document.body, { mode: "javascript" });

    const code = `{{ appsmith.store.id }}`;

    editor.setValue(code);

    // Select the code before commenting
    editor.setSelection(
      { line: 0, ch: 0 },
      { line: editor.lastLine() + 1, ch: 0 },
    );

    handleCodeComment(editor);

    expect(editor.getValue()).toEqual(`{{//  appsmith.store.id }}`);
  });

  it("should handle code comment in JS fields with multiple lines", () => {
    const editor = CodeMirror(document.body, { mode: "javascript" });

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

    handleCodeComment(editor);

    expect(editor.getValue()).toEqual(`  {{//   (() => {
      // const a = "hello";
      // return "Text";
    // })()}}`);
  });
});
