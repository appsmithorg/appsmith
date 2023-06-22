import {
  jsEditor,
  locators,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Test cases around bracket notation", function () {
  const jsObjectBody = `export default {
        "my variable 1": [],
        myVar2: {},
        myFun1(){
            
        },
        myFun2: async () => {
            // use async-await or promises
        }
    }`;

  it("1. Verifies if js object variable with space in name is completed using bracket notation", function () {
    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });

    agHelper.GetNClick(jsEditor._lineinJsEditor(5));
    agHelper.TypeText(locators._codeMirrorTextArea, "this.");
    agHelper.GetNAssertElementText(locators._hints, "my variable 1");
    agHelper.Sleep();
    agHelper.GetNClickByContains(locators._hints, "my variable 1");
    agHelper.GetNAssertElementText(
      jsEditor._lineinJsEditor(5),
      'this["my variable 1"]',
      "contain.text",
    );
    agHelper.Sleep();
    agHelper.GetNClick(jsEditor._lineinJsEditor(5), 0, true);
    agHelper.SelectNRemoveLineText(locators._codeMirrorTextArea);
    agHelper.TypeText(locators._codeMirrorTextArea, 'this["');
    agHelper.GetNAssertElementText(locators._hints, "my variable 1");
    agHelper.Sleep();
    agHelper.GetNClickByContains(locators._hints, "my variable 1");
    agHelper.GetNAssertElementText(
      jsEditor._lineinJsEditor(5),
      'this["my variable 1"]',
      "contain.text",
    );
  });
});
