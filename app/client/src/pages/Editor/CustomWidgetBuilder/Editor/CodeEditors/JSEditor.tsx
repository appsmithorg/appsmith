import React, { useContext, useEffect, useState } from "react";
import type { ContentProps } from "./types";
import styles from "./styles.module.css";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { CustomWidgetBuilderContext } from "../..";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { getAppsmithScriptSchema } from "widgets/CustomWidget/component/constants";
import { getCodeMirrorTernService } from "utils/autocomplete/CodemirrorTernService";
import { Spinner } from "design-system";
import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";

export default function JSEditor(props: ContentProps) {
  const [loading, setLoading] = useState(true);

  const { model, showConnectionLostMessage, uncompiledSrcDoc, update } =
    useContext(CustomWidgetBuilderContext);

  const { height } = props;

  // const errors = useMemo(() => {
  //   return debuggerLogs
  //     ?.filter(d => d.type === DebuggerLogType.ERROR)
  //     .map((d) => d.args)
  //     .flat()
  //     .map((d) => ({
  //       errorType: PropertyEvaluationErrorType.LINT,
  //       raw: uncompiledSrcDoc?.js,
  //       severity: Severity.ERROR,
  //       errorMessage: {
  //         name: "LintingError",
  //         message: d.message,
  //       },
  //       errorSegment:uncompiledSrcDoc?.js,
  //       originalBinding: uncompiledSrcDoc?.js,
  //       variables: [],
  //       code: "",
  //       line: d.line,
  //       ch: d.column,
  //     }));
  // }, [debuggerLogs]);

  useEffect(() => {
    ["LIB/node-forge", "LIB/moment", "base64-js", "LIB/lodash"].forEach((d) => {
      getCodeMirrorTernService().removeDef(d);
    });
  }, []);

  return (
    <div className={styles.wrapper}>
      <LazyCodeEditor
        additionalDynamicData={getAppsmithScriptSchema(model || {})}
        border={CodeEditorBorder.NONE}
        borderLess
        className={"js-editor"}
        disabled={showConnectionLostMessage}
        focusElementName="custom-widget-js-editor"
        folding
        height={height}
        hideEvaluatedValue
        ignoreSlashCommand
        input={{
          value: uncompiledSrcDoc?.js,
          onChange: (value) => {
            update?.("js", value);
          },
        }}
        mode={EditorModes.JAVASCRIPT}
        onLoad={() => setLoading(false)}
        placeholder={createMessage(
          CUSTOM_WIDGET_FEATURE.builder.editor.js.placeholder,
        )}
        showLightningMenu={false}
        showLineNumbers
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={EditorTheme.LIGHT}
      />
      {loading && (
        <div className={styles.loader} style={{ height }}>
          <Spinner size="lg" />
        </div>
      )}
    </div>
  );
}
