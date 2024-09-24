import React, { useContext, useEffect, useMemo, useState } from "react";
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
// import { DebuggerLogType } from "../../types";
// import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
// import { Severity } from "entities/AppsmithConsole";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";
import { Spinner } from "@appsmith/ads";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import { DebuggerLogType } from "../../types";
import type { LintError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { Severity } from "entities/AppsmithConsole";
import { isUndefined } from "lodash";

export default function JSEditor(props: ContentProps) {
  const [loading, setLoading] = useState(true);

  const {
    debuggerLogs,
    model,
    showConnectionLostMessage,
    uncompiledSrcDoc,
    update,
  } = useContext(CustomWidgetBuilderContext);

  const { height } = props;

  const errors: LintError[] = useMemo(() => {
    return debuggerLogs
      ? debuggerLogs
          .filter((d) => d.type === DebuggerLogType.ERROR)
          .map((d) => d.args)
          .flat()
          .filter((d) => !isUndefined(d.line) && !isUndefined(d.column))
          .map((d) => ({
            errorType: PropertyEvaluationErrorType.LINT,
            raw: uncompiledSrcDoc?.js || "",
            severity: Severity.ERROR,
            errorMessage: {
              name: "LintingError",
              message: d.message as string,
            },
            errorSegment: uncompiledSrcDoc?.js || "",
            originalBinding: uncompiledSrcDoc?.js || "",
            variables: [],
            code: "",
            line: d.line ? d.line - 1 : 1,
            ch: d.column ? d.column + 2 : 1,
          }))
      : [];
  }, [debuggerLogs]);

  useEffect(() => {
    ["LIB/node-forge", "LIB/moment", "base64-js", "LIB/lodash"].forEach((d) => {
      CodemirrorTernService.removeDef(d);
    });
  }, []);

  return (
    <div className={styles.wrapper}>
      <LazyCodeEditor
        additionalDynamicData={getAppsmithScriptSchema(model || {})}
        border={CodeEditorBorder.NONE}
        borderLess
        className={"js-editor"}
        customErrors={errors}
        dataTreePath={"customwidget.js"}
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
