import {
  dataManager,
  agHelper,
  jsEditor,
  apiPage,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JS data update on button click",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("jsFunctionTriggerDsl");
    });

    it("1. Populates js function data when triggered via button click", function () {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
        "Api1",
      );

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
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.ClickButton("Submit");
      agHelper.AssertContains("myFun1 Data", "exist");
      agHelper.AssertContains("myFun2 Data", "exist");
    });
  },
);
