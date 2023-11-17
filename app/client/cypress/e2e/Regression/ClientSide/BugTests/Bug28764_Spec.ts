import {
  agHelper,
  locators,
  entityExplorer,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";

describe("JS Function Execution", function () {
  before(() => {
    entityExplorer.NavigateToSwitcher("Explorer");
  });

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

    entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    // Assert lint error
    agHelper.AssertElementLength(locators._lintErrorElement, 1);
    agHelper.HoverElement(locators._lintErrorElement);
    agHelper.AssertContains(`'fff' is not defined`);

    entityExplorer.SelectEntityByName("JSObject2", "Queries/JS");
    agHelper.AssertElementAbsence(locators._lintErrorElement);

    entityExplorer.SelectEntityByName("JSObject1", "Queries/JS");
    // Assert lint error
    agHelper.AssertElementLength(locators._lintErrorElement, 1);
    agHelper.HoverElement(locators._lintErrorElement);
    agHelper.AssertContains(`'fff' is not defined`);
  });
});
