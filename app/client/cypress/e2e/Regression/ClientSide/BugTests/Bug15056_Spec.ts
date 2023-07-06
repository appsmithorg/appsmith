import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import datasourceFormData from "../../../../fixtures/datasources.json";

const agHelper = ObjectsRegistry.AggregateHelper;
const jsEditor = ObjectsRegistry.JSEditor;
const apiPage = ObjectsRegistry.ApiPage;
const ee = ObjectsRegistry.EntityExplorer;

describe("JS data update on button click", function () {
  before(() => {
    agHelper.AddDsl("jsFunctionTriggerDsl");
  });

  it("1. Populates js function data when triggered via button click", function () {
    apiPage.CreateAndFillApi(datasourceFormData.mockApiUrl, "Api1");

    const jsObjectString = `export default {
        myVar1: [],
        myVar2: {},
        myFun1: async () => {
            //write code here
       const data = await Api1.run()
         return "myFun1 Data"
        },
        myFun2: async () => {
            //use async-await or promises
        await this.myFun1()
            return "myFun2 Data"
        }
    }`;

    jsEditor.CreateJSObject(jsObjectString, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });
    ee.SelectEntityByName("Button2", "Widgets");
    agHelper.ClickButton("Submit");
    agHelper.AssertContains("myFun1 Data", "exist");
    agHelper.AssertContains("myFun2 Data", "exist");
  });
});
