import {parse, Node} from "acorn";
import { simple } from "acorn-walk";
import { ECMA_VERSION, SourceType } from "../constants/ast";
import { getExpressionStringAtPos, isPositionWithinNode } from "../peekOverlay/utils";

export class PeekOverlayExpressionIdentifier {
    parsedNode?: Node;
    options: PeekOverlayExpressionIdentifierOptions;
    
    constructor(options: PeekOverlayExpressionIdentifierOptions, script?: string, ) {
        this.options = options;
        if (script) this.scriptUpdated(script);``
    }

    scriptUpdated(script: string) {
        this.parsedNode = parse(script, { ecmaVersion: ECMA_VERSION, sourceType: this.options.sourceType });
    }

    extractExpressionAtPosition(
        pos: number, 
    ): Promise<string> {
        return new Promise((resolve, reject) => {

            if (!this.parsedNode) {
                throw "PeekOverlayExpressionIdentifier - No valid script found";
            }

            let nodeFound: Node | undefined;

            simple(this.parsedNode, {
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

            nodeFound ? 
                resolve(getExpressionStringAtPos(nodeFound, pos, this.options)) 
                : reject("PeekOverlayExpressionIdentifier - No node found");
        });
    }
}

export type PeekOverlayExpressionIdentifierOptions = {
    sourceType: SourceType;
    thisExpressionReplacement?: string;
}
