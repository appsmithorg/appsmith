import * as babelParser from "@babel/standalone";
import type {
  CustomWidgetBuilderContextValueType,
  DebuggerLogItem,
} from "./types";

interface CompiledResult {
  code: CustomWidgetBuilderContextValueType["srcDoc"];
  warnings: DebuggerLogItem[];
  errors: DebuggerLogItem[];
}

export const compileSrcDoc = (
  srcDoc: CustomWidgetBuilderContextValueType["srcDoc"],
): CompiledResult => {
  const compiledResult: CompiledResult = {
    code: srcDoc,
    warnings: [],
    errors: [],
  };

  try {
    const result = babelParser.transform(srcDoc.js, {
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

interface BabelError {
  reasonCode: string;
  message: string;
  loc: {
    line: number;
    column: number;
  };
}

export const getBabelError = (e: BabelError): DebuggerLogItem => {
  return {
    line: e.loc.line,
    column: e.loc.column,
    message: e?.toString(),
  };
};
