import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  agHelper = ObjectsRegistry.AggregateHelper;

describe(
  "JS Execution of Higher-order-functions",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    it("1. Completes execution properly", function () {
      const JSObjectWithHigherOrderFunction = `export default{
        myFun1: ()=>{
            return (name)=>name
        },
        myFun2: async ()=>{
            return this.myFun1()("John Doe")
        }
    }`;

      jsEditor.CreateJSObject(JSObjectWithHigherOrderFunction, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      });

      // Select And Run myFun2
      jsEditor.SelectFunctionDropdown("myFun2");
      jsEditor.RunJSObj();

      agHelper.Sleep(3000);
      //Expect to see Response
      agHelper.AssertContains("John Doe");

      // Select And Run myFun1
      jsEditor.SelectFunctionDropdown("myFun1");
      jsEditor.RunJSObj();

      // Expect to see jsfunction execution error
      jsEditor.AssertParseError(true);
    });
  },
);
