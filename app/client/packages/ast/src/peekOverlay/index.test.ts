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

  const checkExpressionAtScript = async (
    pos: number,
    resultString?: string,
  ) => {
    let result;

    try {
      result = await scriptIdentifier.extractExpressionAtPosition(pos);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBe(resultString);
  };

  const checkExpressionAtJsObject = async (
    pos: number,
    resultString?: string,
  ) => {
    let result;

    try {
      result = await jsObjectIdentifier.extractExpressionAtPosition(pos);
    } catch (e) {
      expect(e).toBe(
        "PeekOverlayExpressionIdentifier - No expression found at position",
      );
    }
    expect(result).toBe(resultString);
  };

  it("handles MemberExpressions", async () => {
    // nested properties
    scriptIdentifier.updateScript("Api1.data[0].id");
    // at position 'A'
    // 'A'pi1.data[0].id
    checkExpressionAtScript(0, "Api1");
    // Ap'i'1.data[0].id
    checkExpressionAtScript(2, "Api1");
    // Api1.'d'ata[0].id
    checkExpressionAtScript(6, "Api1.data");
    // Api1.data['0'].id
    checkExpressionAtScript(11, "Api1.data[0]");
    // Api1.data[0].i'd'
    checkExpressionAtScript(14, "Api1.data[0].id");

    // function call
    // argument hover - Api1
    scriptIdentifier.updateScript(`storeValue("abc", Api1.run)`);
    checkExpressionAtScript(18, "Api1");
    scriptIdentifier.updateScript("Api1.check.run()");
    // Ap'i'1.check.run()
    checkExpressionAtScript(2, "Api1");
    // Api1.check.'r'un()
    checkExpressionAtScript(12, "Api1.check.run");

    // local varibles are filtered
    scriptIdentifier.updateScript("Api1.check.data[x].id");
    // Api1
    checkExpressionAtScript(2, "Api1");
    // check
    checkExpressionAtScript(7, "Api1.check");
    // data
    checkExpressionAtScript(12, "Api1.check.data");
    // x
    checkExpressionAtScript(16);
    // id
    checkExpressionAtScript(19);
  });

  it("handles ExpressionStatements", async () => {
    // simple statement
    scriptIdentifier.updateScript("Api1");
    // Ap'i'1
    checkExpressionAtScript(2, "Api1");

    // function call
    scriptIdentifier.updateScript(`storeValue("abc", 123)`);
    // storeValue("a'b'c", 123)
    checkExpressionAtScript(13);
    // st'o'reValue("abc", 123) - functionality not supported now
    checkExpressionAtScript(2);

    // consequent function calls
    scriptIdentifier.updateScript(`Api1.data[0].id.toFixed().toString()`);
    // toFixed
    checkExpressionAtScript(16, "Api1.data[0].id.toFixed");
    // toString
    checkExpressionAtScript(26);

    // function call argument hover
    scriptIdentifier.updateScript(`storeValue("abc", Api1)`);
    checkExpressionAtScript(18, "Api1");
  });

  it("handles BinaryExpressions", async () => {
    // binary expression
    scriptIdentifier.updateScript(
      `Api1.data.users[0].id === "myData test" ? "Yes" : "No"`,
    );

    // id
    checkExpressionAtScript(19, "Api1.data.users[0].id");
    // myData
    checkExpressionAtScript(27);
    // ?
    checkExpressionAtScript(40);
    // Yes
    checkExpressionAtScript(43);
    // :
    checkExpressionAtScript(48);
    // No
    checkExpressionAtScript(51);

    // hardcoded LHS
    scriptIdentifier.updateScript(`"sample" === "myData test" ? "Yes" : "No"`);
    // sample
    checkExpressionAtScript(1);

    // nested expressions
    scriptIdentifier.updateScript(
      `"sample" === "myData test" ? "nested" === "nested check" ? "Yes" : "No" : "No"`,
    );
    // nested
    checkExpressionAtScript(31);
    // nested check
    checkExpressionAtScript(44);
    // Yes
    checkExpressionAtScript(61);
    // No
    checkExpressionAtScript(69);
  });

  it("handles JsObject cases", async () => {
    jsObjectIdentifier.updateScript(JsObjectWithThisKeyword);

    // this keyword cases
    // this
    checkExpressionAtJsObject(140, "JsObject");
    // numArray
    checkExpressionAtJsObject(159, "JsObject.numArray");
    // objectArray
    checkExpressionAtJsObject(180, "JsObject.objectArray");
    // [0]
    checkExpressionAtJsObject(183, "JsObject.objectArray[0]");
    // x
    checkExpressionAtJsObject(186, "JsObject.objectArray[0].x");
    // 'x'
    checkExpressionAtJsObject(208, "JsObject.objectData['x']");
    // 'a'
    checkExpressionAtJsObject(238, "JsObject.objectData['x']['a']");
    // b
    checkExpressionAtJsObject(243, "JsObject.objectData['x']['a'].b");

    // await keyword cases
    // resetWidget
    checkExpressionAtJsObject(255);
    // "Switch1"
    checkExpressionAtJsObject(266);
    // Api1
    checkExpressionAtJsObject(287, "Api1");
    // run
    checkExpressionAtJsObject(292, "Api1.run");
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
