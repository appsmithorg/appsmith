import { useCallback, useEffect, useState } from "react";
import { EditorState, Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
// import { javascript } from "@codemirror/lang-javascript";

export default function useCodeMirror(extensions: Extension[]) {
  const [element, setElement] = useState<HTMLElement>();

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const view = new EditorView({
      state: EditorState.create({
        extensions: [...extensions],
      }),
      parent: element,
    });

    return () => view?.destroy();
  }, [element]);

  return { ref };
}
