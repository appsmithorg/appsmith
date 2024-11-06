import * as _ from "../../../../support/Objects/ObjectsCore";

describe(
  "Invalid JSObject export statement",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    it("1. Shows error toast for invalid js object export statement", function () {
      const JSObjectWithInvalidExport = `{
        myFun1: ()=>{
            return (name)=>name
        },
        myFun2: async ()=>{
            return this.myFun1()("John Doe")
        }
    }`;

      const INVALID_START_STATEMENT = "Start object with export default";

      _.jsEditor.CreateJSObject(JSObjectWithInvalidExport, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      });

      // Assert toast message
      _.agHelper.ValidateToastMessage(INVALID_START_STATEMENT);
    });
  },
);
