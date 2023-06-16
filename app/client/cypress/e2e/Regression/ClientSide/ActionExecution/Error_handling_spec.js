const commonlocators = require("../../../../locators/commonlocators.json");
import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
  apiPage,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";
import data from "../../../../fixtures/TestDataSet1.json";

describe("Test Create Api and Bind to Button widget", function () {
  before("Test_Add users api and execute api", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    entityExplorer.NavigateToSwitcher("Explorer");
    apiPage.CreateAndFillApi(data.userApi + "/random");
  });

  it("1. Call the api with & without error handling", () => {
    entityExplorer.SelectEntityByName("Button1");
    propPane.EnterJSContext("onClick", "{{Api1.run()}}");
    deployMode.DeployApp();

    cy.wait(2000);
    agHelper.ClickButton("Submit");
    cy.wait("@postExecute")
      .its("response.body.responseMeta.status")
      .should("eq", 200);

    cy.get(commonlocators.toastAction)
      .should("have.length", 1)
      .should("contain.text", "failed to execute");
    deployMode.NavigateBacktoEditor();

    //With Error handling
    entityExplorer.SelectEntityByName("Button1");
    propPane.EnterJSContext("onClick", "{{Api1.run(() => {}, () => {})}}");
    deployMode.DeployApp();

    cy.wait(2000);
    agHelper.ClickButton("Submit");
    cy.wait("@postExecute")
      .its("response.body.responseMeta.status")
      .should("eq", 200);
    cy.get(commonlocators.toastAction).should("not.exist");
  });
});
