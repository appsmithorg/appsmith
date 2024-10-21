import { jsEditor } from "../../../../support/Objects/ObjectsCore";

describe("JS Editor cypress test case", { tags: ["@tag.JS"] }, () => {
  it("1. Bug : should accept spaces before export default", () => {
    jsEditor.CreateJSObject(
      `  export default {
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
  });
});