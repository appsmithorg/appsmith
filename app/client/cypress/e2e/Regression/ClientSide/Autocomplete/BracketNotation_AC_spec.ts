import {
  jsEditor,
  locators,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Test cases around bracket notation",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
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
      agHelper.WaitUntilEleAppear(locators._hints);
      agHelper.GetElementsNAssertTextPresence(locators._hints, "my variable 1");
      agHelper.Sleep(); //is needed for hint to stay on screen & then click, tried other checks, but without wait its failing locally & in CI
      agHelper.GetNClickByContains(locators._hints, "my variable 1", 0);
      agHelper.GetNAssertElementText(
        jsEditor._lineinJsEditor(5),
        'this["my variable 1"]',
        "contain.text",
      );
      agHelper.GetNClick(jsEditor._lineinJsEditor(6));
      agHelper.TypeText(locators._codeMirrorTextArea, 'this["');
      agHelper.WaitUntilEleAppear(locators._hints);
      agHelper.GetElementsNAssertTextPresence(locators._hints, "my variable 1");
      agHelper.Sleep(); //is needed for hint to stay on screen & then click, tried other checks, but without wait its failing locally & in CI
      agHelper.GetNClickByContains(locators._hints, "my variable 1", 0, false);
      agHelper.GetNAssertElementText(
        jsEditor._lineinJsEditor(5),
        'this["my variable 1"]',
        "contain.text",
      );
    });
  },
);
