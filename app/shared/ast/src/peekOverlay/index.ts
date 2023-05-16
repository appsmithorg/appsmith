import {parse, Node} from "acorn";
import { simple } from "acorn-walk";
import { ECMA_VERSION, SourceType } from "../constants/ast";
import { getExpressionStringAtPos, isPositionWithinNode } from "../peekOverlay/utils";

export class PeekOverlayExpressionIdentifier {
    private parsedScript?: Node;
    private options: PeekOverlayExpressionIdentifierOptions;
    
    constructor(options: PeekOverlayExpressionIdentifierOptions, script?: string) {
        this.options = options;
        if (script) this.updateScript(script);
    }

    hasParsedScript() {
        return !!this.parsedScript;
    }

    updateScript(script: string) {
        this.parsedScript = parse(script, { ecmaVersion: ECMA_VERSION, sourceType: this.options.sourceType });
    }

    clearScript() {
        this.parsedScript = undefined;
    }

    extractExpressionAtPosition(
        pos: number, 
    ): Promise<string> {
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
                const expressionFound = getExpressionStringAtPos(nodeFound, pos, this.options);
                expressionFound && resolve(expressionFound);
            }
            reject("PeekOverlayExpressionIdentifier - No node/expression found");
        });
    }
}

export type PeekOverlayExpressionIdentifierOptions = {
    sourceType: SourceType;
    thisExpressionReplacement?: string;
}
