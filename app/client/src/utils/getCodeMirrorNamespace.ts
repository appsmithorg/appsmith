import type CodeMirror from "codemirror";

/**
 * This function returns the CodeMirror namespace from the editor instance. Basically, this:
 *
 *     import CodeMirror from "codemirror";
 *
 *     const someCodeMirrorCallback = (cm: CodeMirror.Editor) => {
 *       const pos = CodeMirror.Pos(1, 1);
 *       cm.replaceRange("foo", pos);
 *     }
 *
 * is equivalent to this:
 *
 *     const someCodeMirrorCallback = (cm: CodeMirror.Editor) => {
 *       const CodeMirror = getCodeMirrorNamespaceFromEditor(cm);
 *       const pos = CodeMirror.Pos(1, 1);
 *       cm.replaceRange("foo", pos);
 *     }
 *
 * We use this function to avoid statically importing CodeMirror outside of the code editor.
 * It’s useful in cases where a function has access to the CodeMirror editor (eg because it was called
 * by CodeMirror) but needs to use some APIs that are not exposed on the editor instance (like `CodeMirror.on`,
 * `CodeMirror.Pos`, etc).
 */
export const getCodeMirrorNamespaceFromEditor = (
  editor: CodeMirror.Editor,
): typeof CodeMirror => {
  return editor.constructor as typeof CodeMirror;
};

/**
 * This function returns the CodeMirror namespace from the doc instance. See
 * getCodeMirrorNamespaceFromEditor for more details on why this is needed.
 *
 * @see getCodeMirrorNamespaceFromEditor
 */
export const getCodeMirrorNamespaceFromDoc = (
  doc: CodeMirror.Doc,
): typeof CodeMirror => {
  const editor = doc.getEditor();

  if (!editor) {
    throw new Error(
      "The CodeMirror doc does not belong to an editor. Cannot get the CodeMirror namespace.",
    );
  }

  return getCodeMirrorNamespaceFromEditor(editor);
};
