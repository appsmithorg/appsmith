const commonlocators = require("../../../../locators/commonlocators.json");
let dataSet;
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to Button widget", function () {
  before("Test_Add users api and execute api", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.BUTTON);
    _.entityExplorer.NavigateToSwitcher("Explorer");
    cy.fixture("example").then(function (data) {
      dataSet = data;
      _.apiPage.CreateAndFillApi(dataSet.userApi + "/random");
    });
  });

  it("1. Call the api with & without error handling", () => {
    _.entityExplorer.SelectEntityByName("Button1");
    _.propPane.EnterJSContext("onClick", "{{Api1.run()}}");
    cy.PublishtheApp();

    cy.wait(2000);
    _.agHelper.ClickButton("Submit");
    cy.wait("@postExecute")
      .its("response.body.responseMeta.status")
      .should("eq", 200);

    cy.get(commonlocators.toastAction)
      .should("have.length", 1)
      .should("contain.text", "failed to execute");
    _.deployMode.NavigateBacktoEditor();

    //With Error handling
    _.entityExplorer.SelectEntityByName("Button1");
    _.propPane.EnterJSContext("onClick", "{{Api1.run(() => {}, () => {})}}");
    cy.PublishtheApp();

    cy.wait(2000);
    _.agHelper.ClickButton("Submit");
    cy.wait("@postExecute")
      .its("response.body.responseMeta.status")
      .should("eq", 200);
    cy.get(commonlocators.toastAction).should("not.exist");
  });
});
