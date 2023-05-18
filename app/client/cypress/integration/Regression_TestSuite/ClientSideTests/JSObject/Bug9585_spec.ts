import * as _ from "../../../../support/Objects/ObjectsCore";

const { jsEditor, locators } = _;

describe("List no functions on empty collection", () => {
  it("should not show functions when whole code is deleted", () => {
    jsEditor.CreateJSObject(
      `export default {
  myFun1: () => {
    function hi(a,b) {
      console.log(a,b);
    }
    hi(1,2);
  },
  myFun2: async () => {
    //use async-await or promises
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

    jsEditor.AssertFunctionDropdownValue("myFun1");
    jsEditor.ClearJSObj();
    jsEditor.AssertFunctionDropdownValue("No function available");
  });
});
