import React, { useCallback, useEffect, useState } from "react";
import CodeMirror from "react-codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/base16-light.css";
import { Button, Category, Size } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "ce/reducers";
import ReactJson from "react-json-view";
import usePrevious from "utils/hooks/usePrevious";

export default function Debugger() {
  const [code, setCode] = useState("");

  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
  }, []);

  const options = {
    lineNumbers: true,
    mode: "javascript",
    addModeClass: true,
    theme: "base16-light",
  };

  const dispatch = useDispatch();

  const debug = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "DEBUG", payload: code });
    },
    [code],
  );

  const next = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch({ type: "NEXT_DEBUGGER_STEP" });
    },
    [code],
  );

  const line = useSelector(
    (state: AppState) => state.ui.debugger.codeDebugger.line,
  );

  const previousLine = usePrevious(line);

  const globalState = useSelector(
    (state: AppState) => state.ui.debugger.codeDebugger.context,
  );

  const localState = useSelector(
    (state: AppState) => state.ui.debugger.codeDebugger.localState,
  );

  const ref = React.createRef<any>();

  useEffect(() => {
    const instance = ref.current?.getCodeMirror();
    if (instance && typeof line === "number") {
      if (typeof previousLine === "number") {
        instance.removeLineClass(
          previousLine,
          "background",
          "CodeMirror-activeline-background",
        );
      }
      instance.addLineClass(
        line,
        "background",
        "CodeMirror-activeline-background",
      );
    }
  }, [line]);

  return (
    <div className="flex flex-row w-full h-100">
      <div className="flex flex-col flex-1" style={{ height: "600px" }}>
        <CodeMirror
          onChange={updateCode}
          options={options}
          ref={ref}
          value={code}
        />
        <div className="flex flex-row justify-center mt-2 flex-shrink-0">
          <Button
            category={Category.secondary}
            icon="bug"
            onClick={debug}
            size={Size.medium}
            tag="button"
            text="Debug"
          />
          <Button
            category={Category.tertiary}
            onClick={next}
            size={Size.medium}
            tag="button"
            text="Next"
          />
        </div>
      </div>
      <div style={{ width: "300px" }}>
        <ReactJson src={{ localState, globalState }} />
      </div>
    </div>
  );
}
