import { jsEditor } from "../../../../support/Objects/ObjectsCore";

describe(
  "List no functions on empty collection",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    it("1. Bug 9585: should not show functions when whole code is deleted", () => {
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
          completeReplace: true,
          toRun: false,
          prettify: false,
        },
      );

      jsEditor.AssertSelectedFunction("myFun1");
      jsEditor.ClearJSObj();
      jsEditor.AssertSelectedFunction("No function available");
    });
  },
);
