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

  let result: string | undefined;

  it("handles MemberExpressions", async () => {
    // nested properties
    scriptIdentifier.updateScript("Api1.data[0].id");

    // at position 'A'
    // 'A'pi1.data[0].id
    result = await scriptIdentifier.extractExpressionAtPosition(0);
    expect(result).toBe("Api1");

    // Ap'i'1.data[0].id
    result = await scriptIdentifier.extractExpressionAtPosition(2);
    expect(result).toBe("Api1");

    // Api1.'d'ata[0].id
    result = await scriptIdentifier.extractExpressionAtPosition(6);
    expect(result).toBe("Api1.data");

    // Api1.data['0'].id
    result = await scriptIdentifier.extractExpressionAtPosition(11);
    expect(result).toBe("Api1.data[0]");

    // Api1.data[0].i'd'
    result = await scriptIdentifier.extractExpressionAtPosition(14);
    expect(result).toBe("Api1.data[0].id");

    // function calls
    scriptIdentifier.updateScript("Api1.check.run()");
    // Ap'i'1.check.run()
    result = await scriptIdentifier.extractExpressionAtPosition(2);
    expect(result).toBe("Api1");

    // Api1.check.'r'un()
    result = await scriptIdentifier.extractExpressionAtPosition(12);
    expect(result).toBe("Api1.check.run");

    // local varibles are filtered
    scriptIdentifier.updateScript("Api1.check.data[x].id");

    // Api1
    result = await scriptIdentifier.extractExpressionAtPosition(2);
    expect(result).toBe("Api1");

    // check
    result = await scriptIdentifier.extractExpressionAtPosition(7);
    expect(result).toBe("Api1.check");

    // data
    result = await scriptIdentifier.extractExpressionAtPosition(12);
    expect(result).toBe("Api1.check.data");

    // x
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(16);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBe(undefined);

    // id
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(19);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBe(undefined);
  });

  it("handles ExpressionStatements", async () => {
    // simple statement
    scriptIdentifier.updateScript("Api1");
    // Ap'i'1
    result = await scriptIdentifier.extractExpressionAtPosition(2);
    expect(result).toBe("Api1");
    // // function call
    // scriptIdentifier.updateScript(`storeValue("abc", 123)`);
    // // st'o'reValue("abc", 123) - functionality not supported now
    // try {
    //   result = undefined;
    //   result = await scriptIdentifier.extractExpressionAtPosition(2);
    // } catch (e) {
    //   expect(e).toBe(
    //     "PeekOverlayExpressionIdentifier - No expression found at position",
    //   );
    // }
    // expect(result).toBe(undefined);
    // // storeValue("a'b'c", 123)
    // try {
    //   result = undefined;
    //   result = await scriptIdentifier.extractExpressionAtPosition(13);
    // } catch (e) {
    //   expect(e).toBe(
    //     "PeekOverlayExpressionIdentifier - No expression found at position",
    //   );
    // }
  });

  it("handles BinaryExpressions", async () => {
    scriptIdentifier.updateScript(
      `Api1.data.users[0].id === "myData test" ? "Yes" : "No"`,
    );

    // id
    result = await scriptIdentifier.extractExpressionAtPosition(19);
    expect(result).toBe("Api1.data.users[0].id");

    // myData
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(27);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBeUndefined();

    // ?
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(40);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBeUndefined();

    // Yes
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(43);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBeUndefined();

    // :
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(48);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBeUndefined();

    // No
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(51);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBeUndefined();

    // hardcoded LHS
    scriptIdentifier.updateScript(`"sample" === "myData test" ? "Yes" : "No"`);
    // sample
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(1);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }

    // nested expressions
    scriptIdentifier.updateScript(
      `"sample" === "myData test" ? "nested" === "nested check" ? "Yes" : "No" : "No"`,
    );
    // nested
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(31);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }

    // nested check
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(44);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }

    // Yes
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(61);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }

    // No
    try {
      result = undefined;
      result = await scriptIdentifier.extractExpressionAtPosition(69);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
  });

  it("handles JsObject cases", async () => {
    jsObjectIdentifier.updateScript(JsObjectWithThisKeyword);

    // this keyword cases
    result = await jsObjectIdentifier.extractExpressionAtPosition(140);
    expect(result).toBe("JsObject");

    result = await jsObjectIdentifier.extractExpressionAtPosition(159);
    expect(result).toBe("JsObject.numArray");

    result = await jsObjectIdentifier.extractExpressionAtPosition(180);
    expect(result).toBe("JsObject.objectArray");

    result = await jsObjectIdentifier.extractExpressionAtPosition(183);
    expect(result).toBe("JsObject.objectArray[0]");

    result = await jsObjectIdentifier.extractExpressionAtPosition(186);
    expect(result).toBe("JsObject.objectArray[0].x");

    result = await jsObjectIdentifier.extractExpressionAtPosition(208);
    expect(result).toBe("JsObject.objectData['x']");

    result = await jsObjectIdentifier.extractExpressionAtPosition(238);
    expect(result).toBe("JsObject.objectData['x']['a']");

    result = await jsObjectIdentifier.extractExpressionAtPosition(243);
    expect(result).toBe("JsObject.objectData['x']['a'].b");

    // await keyword cases
    // resetWidget
    // try {
    //   result = undefined;
    //   result = await jsObjectIdentifier.extractExpressionAtPosition(255);
    // } catch (e) {
    //   expect(e).toBe(
    //     "PeekOverlayExpressionIdentifier - No expression found at position",
    //   );
    // }
    // expect(result).toBeUndefined();

    // "Switch1"
    try {
      result = undefined;
      result = await jsObjectIdentifier.extractExpressionAtPosition(266);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBeUndefined();

    // Api1
    result = await jsObjectIdentifier.extractExpressionAtPosition(287);
    expect(result).toBe("Api1");

    // run
    result = await jsObjectIdentifier.extractExpressionAtPosition(292);
    expect(result).toBe("Api1.run");
  });

  it("test cases", async () => {
    // member expression
    result = undefined;
    scriptIdentifier.updateScript(`moment().format("dddd")`);
    result = await scriptIdentifier.extractExpressionAtPosition(0);
    expect(result).toBe("moment");

    // expression statements
    result = undefined;
    scriptIdentifier.updateScript(`storeValue("abc", Api1)`);
    result = await scriptIdentifier.extractExpressionAtPosition(18);
    expect(result).toBe("Api1");

    result = undefined;
    scriptIdentifier.updateScript(`storeValue("abc", Api1.run)`);
    result = await scriptIdentifier.extractExpressionAtPosition(18);
    expect(result).toBe("Api1");
  });
});

const JsObjectWithThisKeyword = `export default {
	numArray: [1, 2, 3],
	objectArray: [ {x: 123}, { y: "123"} ],
	objectData: { x: 123, y: "123" },
	myFun1: async () => {
		this;
		this.numArray;
		this.objectArray[0].x;
		this.objectData["x"];
    this.objectData["x"]["a"].b;
		await resetWidget("Switch1");
    await Api1.run();
	},
}`;
