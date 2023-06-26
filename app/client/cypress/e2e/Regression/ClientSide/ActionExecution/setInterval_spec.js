import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
  assertHelper,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import data from "../../../../fixtures/TestDataSet1.json";

describe("Test Create Api and Bind to Button widget", function () {
  before("Test_Add users api and execute api", () => {
    cy.fixture("buttonApiDsl").then((val) => {
      agHelper.AddDsl(val);
    });

    cy.createAndFillApi(data.userApi, "/mock-api?records=10");
    cy.RunAPI();
  });

  it("1. Selects set interval function, Fill setInterval action creator and test code generated ", () => {
    entityExplorer.SelectEntityByName("Button1");
    propPane.SelectPlatformFunction("onClick", "Set interval");
    agHelper.EnterActionValue("Callback function", "{{() => { Api1.run() }}}");
    agHelper.EnterActionValue("Id", "myInterval");
    propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {  Api1.run();}, 5000, 'myInterval');}}",
    );

    //Works in the published version"
    deployMode.DeployApp();
    agHelper.Sleep(3000);
    agHelper.GetClosestNClick(locators._submit,"div",0,true);
    assertHelper.AssertNetworkStatus("@postExecute",200)  
    agHelper.Sleep(3000);
    assertHelper.AssertNetworkStatus("@postExecute",200)  
    deployMode.NavigateBacktoEditor();
  });

  it("2. Selects clear interval function, Fill clearInterval action creator and test code generated", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.ToggleJSMode("onClick", false);
    agHelper.GetNClick(propPane._actionCard,0,true);
    agHelper.GetNClick(propPane._actionSelectorDelete,0,true);
    propPane.SelectPlatformFunction("onClick", "Clear interval");
    agHelper.EnterActionValue("Id", "myInterval");
    propPane.ToggleJSMode("onClick");
    propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{clearInterval('myInterval');}}`,
    );
  });
});
