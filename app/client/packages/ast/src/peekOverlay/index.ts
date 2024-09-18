import type { Node } from "acorn";
import { parse } from "acorn";
import { simple } from "acorn-walk";
import type { SourceType } from "../constants/ast";
import { ECMA_VERSION } from "../constants/ast";
import { getExpressionStringAtPos, isPositionWithinNode } from "./utils";

export class PeekOverlayExpressionIdentifier {
  private parsedScript?: Node;
  private options: PeekOverlayExpressionIdentifierOptions;

  constructor(
    options: PeekOverlayExpressionIdentifierOptions,
    script?: string,
  ) {
    this.options = options;

    if (script) this.updateScript(script);
  }

  hasParsedScript() {
    return !!this.parsedScript;
  }

  updateScript(script: string) {
    try {
      this.parsedScript = parse(script, {
        ecmaVersion: ECMA_VERSION,
        sourceType: this.options.sourceType,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  clearScript() {
    this.parsedScript = undefined;
  }

  async extractExpressionAtPosition(pos: number): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.parsedScript) {
        throw "PeekOverlayExpressionIdentifier - No valid script found";
      }

      let nodeFound: Node | undefined;

      simple(this.parsedScript, {
        MemberExpression(node: Node) {
          if (!nodeFound && isPositionWithinNode(node, pos)) {
            nodeFound = node;
          }
        },
        ExpressionStatement(node: Node) {
          if (!nodeFound && isPositionWithinNode(node, pos)) {
            nodeFound = node;
          }
        },
      });

      if (nodeFound) {
        const expressionFound = getExpressionStringAtPos(
          nodeFound,
          pos,
          this.options,
        );

        if (expressionFound) {
          resolve(expressionFound);
        } else {
          reject(
            "PeekOverlayExpressionIdentifier - No expression found at position",
          );
        }
      }

      reject("PeekOverlayExpressionIdentifier - No node found");
    });
  }
}

export interface PeekOverlayExpressionIdentifierOptions {
  sourceType: SourceType;
  thisExpressionReplacement?: string;
}
