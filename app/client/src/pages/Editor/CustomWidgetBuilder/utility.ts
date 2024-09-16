import { transform } from "@babel/standalone/";
import type { DebuggerLogItem, SrcDoc } from "./types";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import { CUSTOM_WIDGET_ONREADY_DOC_URL } from "./constants";
import { compileString } from "sass";

interface CompiledResult {
  code: SrcDoc;
  warnings: DebuggerLogItem[];
  errors: DebuggerLogItem[];
}

export const compileSrcDoc = (srcDoc: SrcDoc): CompiledResult => {
  const compiledResult: CompiledResult = {
    code: srcDoc,
    warnings: [],
    errors: [],
  };

  checkForWarnings(compiledResult);

  try {
    const result = transform(srcDoc.js, {
      sourceType: "module",
      presets: ["react"],
      targets: {
        esmodules: true,
      },
    });

    compiledResult.code = {
      ...compiledResult.code,
      js: result?.code || "",
    };
  } catch (e) {
    compiledResult.errors.push(getError(e as BabelError));
  }

  try {
    compiledResult.code = {
      ...compiledResult.code,
      css: compileString(srcDoc.css).css || "",
    };
  } catch (e) {
    compiledResult.warnings.push(getError(e as BabelError));
  }

  return compiledResult;
};

function checkForWarnings(compiledResult: CompiledResult) {
  const code = compiledResult.code.js;

  if (code?.length > 0) {
    /*
     * Check whether the code has an onReady function.
     * We are keeping this check as a simple string check instead of using AST
     * because we want to keep the custom widget compile process as simple as possible.
     */
    !code.match(/appsmith[\n\t\s]*\.[\n\t\s]*onReady[\n\t\s]*\(/) &&
      compiledResult.warnings.push({
        message: createMessage(
          CUSTOM_WIDGET_FEATURE.debugger.noOnReadyWarning,
          CUSTOM_WIDGET_ONREADY_DOC_URL,
        ),
      });
  }
}

export interface BabelError {
  reasonCode: string;
  message: string;
  loc: {
    line: number;
    column: number;
  };
}

export const getError = (e: BabelError): DebuggerLogItem => {
  return {
    line: e?.loc?.line,
    column: e?.loc?.column,
    message: e?.toString(),
  };
};
