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
});