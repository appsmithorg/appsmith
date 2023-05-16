import { SourceType } from "../constants/ast";
import { PeekOverlayExpressionIdentifier } from "./index";

describe("extractExpressionAtPositionWholeDoc", () => {
    const scriptIdentifier = new PeekOverlayExpressionIdentifier({
        sourceType: SourceType.script,
    });

    const jsObjectIdentifier = new PeekOverlayExpressionIdentifier({
        sourceType: SourceType.module,
        thisExpressionReplacement: "JsObject",
    });
    it("handles MemberExpressions", async () => {
        let result;
        scriptIdentifier.scriptUpdated("Api1.data[0].id");

        // nested properties

        // at position 'A'
        // 'A'pi1.data[0].id
        result = await scriptIdentifier.extractExpressionAtPosition(0)
        expect(result).toBe("Api1");

        // Ap'i'1.data[0].id
        result = await scriptIdentifier.extractExpressionAtPosition(2)
        expect(result).toBe("Api1");

        // Api1.'d'ata[0].id
        result = await scriptIdentifier.extractExpressionAtPosition(6)
        expect(result).toBe("Api1.data");

        // Api1.data'['0].id
        result = await scriptIdentifier.extractExpressionAtPosition(10)
        expect(result).toBe("Api1.data[0]");

        // Api1.data['0'].id
        result = await scriptIdentifier.extractExpressionAtPosition(11)
        expect(result).toBe("Api1.data[0]");

        // Api1.data[0']'.id
        result = await scriptIdentifier.extractExpressionAtPosition(12)
        expect(result).toBe("Api1.data[0]");

        // Api1.data[0].'i'd
        result = await scriptIdentifier.extractExpressionAtPosition(14)
        expect(result).toBe("Api1.data[0].id");


        // function calls
        scriptIdentifier.scriptUpdated("Api1.check.run()");
        // Ap'i'1.check.run()
        result = await scriptIdentifier.extractExpressionAtPosition(2)
        expect(result).toBe("Api1");

        // Api1.check.'r'un()
        result = await scriptIdentifier.extractExpressionAtPosition(12)
        expect(result).toBe("Api1.check.run");
    });

    it("handles ExpressionStatements", async () => {
        let result;


        // simple statement
        scriptIdentifier.scriptUpdated("Api1");
        // Ap'i'1
        result = await scriptIdentifier.extractExpressionAtPosition(2)
        expect(result).toBe("Api1");


        // function call
        scriptIdentifier.scriptUpdated(`storeValue("abc", 123)`);
        
        // st'o'reValue("abc", 123) - functionality not supported now
        try {
            result = await scriptIdentifier.extractExpressionAtPosition(2)
        } catch (e) {
            expect(e).toBe("PeekOverlayExpressionIdentifier - No node/expression found");
        }

        // storeValue("a'b'c", 123)
        try {
            result = await scriptIdentifier.extractExpressionAtPosition(13)
        } catch (e) {
            expect(e).toBe("PeekOverlayExpressionIdentifier - No node/expression found");
        }
    });

    it ("handles this keyword replacement", async () => {
        let result;
        jsObjectIdentifier.scriptUpdated(JsObjectWithThisKeyword);

        result = await jsObjectIdentifier.extractExpressionAtPosition(134);
        expect(result).toBe("JsObject");

        result = await jsObjectIdentifier.extractExpressionAtPosition(153);
        expect(result).toBe("JsObject.numArray");

        result = await jsObjectIdentifier.extractExpressionAtPosition(174);
        expect(result).toBe("JsObject.objectArray");

        result = await jsObjectIdentifier.extractExpressionAtPosition(177);
        expect(result).toBe("JsObject.objectArray[0]");

        result = await jsObjectIdentifier.extractExpressionAtPosition(180);
        expect(result).toBe("JsObject.objectArray[0].x");

        result = await jsObjectIdentifier.extractExpressionAtPosition(202);
        expect(result).toBe("JsObject.objectData['x']");

        result = await jsObjectIdentifier.extractExpressionAtPosition(236);
        expect(result).toBe("JsObject.objectData['x']['a']");

        result = await jsObjectIdentifier.extractExpressionAtPosition(241);
        expect(result).toBe("JsObject.objectData['x']['a'].b");
    });
});

const JsObjectWithThisKeyword = `export default {
	numArray: [1, 2, 3],
	objectArray: [ {x: 123}, { y: "123"} ],
	objectData: { x: 123, y: "123" },
	myFun1: () => {
		this;
		this.numArray;
		this.objectArray[0].x;
		this.objectData["x"];
        this.objectData["x"]["a"].b;
	},
}`;