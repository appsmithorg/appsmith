import { SourceType } from "../constants/ast";
import { extractExpressionAtPosition } from "./index";

describe("extractExpressionAtPositionWholeDoc", () => {
    it("handles MemberExpressions", async () => {
        let result;

        // nested properties

        // at position 'A'
        // 'A'pi1.data[0].id
        result = await extractExpressionAtPosition("Api1.data[0].id", 0)
        expect(result).toBe("Api1");

        // Ap'i'1.data[0].id
        result = await extractExpressionAtPosition("Api1.data[0].id", 2)
        expect(result).toBe("Api1");

        // Api1.'d'ata[0].id
        result = await extractExpressionAtPosition("Api1.data[0].id", 6)
        expect(result).toBe("Api1.data");

        // Api1.data'['0].id
        result = await extractExpressionAtPosition("Api1.data[0].id", 10)
        expect(result).toBe("Api1.data[0]");

        // Api1.data['0'].id
        result = await extractExpressionAtPosition("Api1.data[0].id", 11)
        expect(result).toBe("Api1.data[0]");

        // Api1.data[0']'.id
        result = await extractExpressionAtPosition("Api1.data[0].id", 12)
        expect(result).toBe("Api1.data[0]");

        // Api1.data[0].'i'd
        result = await extractExpressionAtPosition("Api1.data[0].id", 14)
        expect(result).toBe("Api1.data[0].id");


        // function calls
        // Ap'i'1.run()
        result = await extractExpressionAtPosition("Api1.run()", 2)
        expect(result).toBe("Api1");

        // Api1.'r'un()
        result = await extractExpressionAtPosition("Api1.run()", 6)
        expect(result).toBe("Api1.run");
    });

    it("handles ExpressionStatements", async () => {
        let result;

        // simple statement
        // Ap'i'1
        result = await extractExpressionAtPosition("Api1", 2)
        expect(result).toBe("Api1");
    });

    it ("handles this keyword replacement", async () => {
        let result;

        result = await extractExpressionAtPosition(JsObjectWithThisKeyword, 134, SourceType.module, {
            thisExpressionReplacement: "JsObject",
        })
        expect(result).toBe("JsObject");

        result = await extractExpressionAtPosition(JsObjectWithThisKeyword, 153, SourceType.module, {
            thisExpressionReplacement: "JsObject",
        })
        expect(result).toBe("JsObject.numArray");

        result = await extractExpressionAtPosition(JsObjectWithThisKeyword, 174, SourceType.module, {
            thisExpressionReplacement: "JsObject",
        })
        expect(result).toBe("JsObject.objectArray");

        result = await extractExpressionAtPosition(JsObjectWithThisKeyword, 177, SourceType.module, {
            thisExpressionReplacement: "JsObject",
        })
        expect(result).toBe("JsObject.objectArray[0]");

        result = await extractExpressionAtPosition(JsObjectWithThisKeyword, 180, SourceType.module, {
            thisExpressionReplacement: "JsObject",
        })
        expect(result).toBe("JsObject.objectArray[0].x");

        result = await extractExpressionAtPosition(JsObjectWithThisKeyword, 202, SourceType.module, {
            thisExpressionReplacement: "JsObject",
        })
        expect(result).toBe("JsObject.objectData['x']");

        result = await extractExpressionAtPosition(JsObjectWithThisKeyword, 236, SourceType.module, {
            thisExpressionReplacement: "JsObject",
        })
        expect(result).toBe("JsObject.objectData['x']['a']");

        result = await extractExpressionAtPosition(JsObjectWithThisKeyword, 241, SourceType.module, {
            thisExpressionReplacement: "JsObject",
        })
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