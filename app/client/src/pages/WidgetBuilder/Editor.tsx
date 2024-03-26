import type { EditorConfiguration } from "codemirror";
import React, { createRef, useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import CodeMirror from "codemirror";
import "codemirror/mode/htmlmixed/htmlmixed";
import "codemirror/mode/css/css";
import { debounce } from "lodash";

export function Editor(props: any) {
  const target = createRef<HTMLDivElement>();
  let editor: any;

  const debouncedOnChange = debounce(props.onChange, 1000);

  useEffect(() => {
    const options: EditorConfiguration = {
      autoRefresh: true,
      mode: props.mode,
      viewportMargin: 10,
      tabSize: 2,
      autoCloseBrackets: true,
      indentWithTabs: true,
      lineWrapping: true,
      lineNumbers: true,
      addModeClass: true,
      matchBrackets: false,
      scrollbarStyle: "native",
      tabindex: -1,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      configureMouse: () => {
        return {
          addNew: false,
        };
      },
    };

    const gutters = new Set<string>();

    gutters.add("CodeMirror-linenumbers");
    gutters.add("CodeMirror-foldgutter");

    options.foldGutter = true;

    options.gutters = Array.from(gutters);

    options.value = props.value;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editor = CodeMirror(target.current, options);

    editor.setSize("100%", props.height);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    editor.on("change", (value) => {
      debouncedOnChange(value.getValue());
    });
  }, []);

  useEffect(() => {
    editor?.setValue(props.value);
  }, [props.value]);

  useEffect(() => {
    editor?.setSize("100%", props.height);
  }, [props.height]);

  return (
    <div style={{ padding: "0 10px" }}>
      <div>{props.label}</div>
      <div ref={target} style={{ border: "1px solid #000" }} />
    </div>
  );
}
