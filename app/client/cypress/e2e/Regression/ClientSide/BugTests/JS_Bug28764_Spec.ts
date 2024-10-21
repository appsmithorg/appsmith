import {
  agHelper,
  locators,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JS Function Execution",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    it("Retains lint errors after navigation", function () {
      // JS Object 1
      jsEditor.CreateJSObject(
        `export default {
          myVar1: [],
          myVar2: {},
          myFun1 () {
              //	write code here
              //	this.myVar1 = [1,2,3]
          },
          async myFun2 () {
              //	use async-await or promises
              //	Lint Error
              fff
          }
      }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
          prettify: false,
        },
      );
      // JS Object 2
      jsEditor.CreateJSObject(
        `export default {
          myVar1: [],
          myVar2: {},
          myFun1 () {
              //	write code here
              //	this.myVar1 = [1,2,3]
          },
          async myFun2 () {
              //	use async-await or promises
          }
      }`,
        {
          paste: true,
          completeReplace: true,
          toRun: false,
          shouldCreateNewJSObj: true,
          prettify: false,
        },
      );

      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      // Assert lint error
      agHelper.AssertElementLength(locators._lintErrorElement, 1);
      agHelper.HoverElement(locators._lintErrorElement);
      agHelper.AssertContains(`'fff' is not defined`);

      EditorNavigation.SelectEntityByName("JSObject2", EntityType.JSObject);
      agHelper.AssertElementAbsence(locators._lintErrorElement);

      EditorNavigation.SelectEntityByName("JSObject1", EntityType.JSObject);
      // Assert lint error
      agHelper.AssertElementLength(locators._lintErrorElement, 1);
      agHelper.HoverElement(locators._lintErrorElement);
      agHelper.AssertContains(`'fff' is not defined`);
    });
  },
);
