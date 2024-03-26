import { transform } from "@babel/standalone/";
import type { DebuggerLogItem, SrcDoc } from "./types";
import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";
import { CUSTOM_WIDGET_ONREADY_DOC_URL } from "./constants";

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
    compiledResult.errors.push(getBabelError(e as BabelError));
  }

  return compiledResult;
};

function checkForWarnings(compiledResult: CompiledResult) {
  const code = compiledResult.code.js;

  if (code?.length > 0) {
    /*
     * We are keeping this check as a simple string check instead of using AST
     * because we want to keep the custom widget compile process as simple as possible.
     */
    !code.includes("appsmith.onReady(") &&
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

export const getBabelError = (e: BabelError): DebuggerLogItem => {
  return {
    line: e?.loc?.line,
    column: e?.loc?.column,
    message: e?.toString(),
  };
};
