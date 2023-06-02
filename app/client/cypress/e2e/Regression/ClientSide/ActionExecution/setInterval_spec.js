const dsl = require("../../../../fixtures/buttonApiDsl.json");

import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to Button widget", function () {
  let dataSet;
  before("Test_Add users api and execute api", () => {
    cy.addDsl(dsl);

    cy.fixture("example").then(function (data) {
      dataSet = data;
      cy.createAndFillApi(dataSet.userApi, "/users");
      cy.RunAPI();
    });
  });

  it("1. Selects set interval function, Fill setInterval action creator and test code generated ", () => {
    _.entityExplorer.SelectEntityByName("Button1");
    _.propPane.SelectPlatformFunction("onClick", "Set interval");
    _.agHelper.EnterActionValue(
      "Callback function",
      "{{() => { Api1.run() }}}",
    );
    _.agHelper.EnterActionValue("Id", "myInterval");
    _.propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {  Api1.run();}, 5000, 'myInterval');}}",
    );

    //Works in the published version"
    _.deployMode.DeployApp();
    cy.wait(3000);
    cy.get("span:contains('Submit')").closest("div").click();
    cy.wait("@postExecute")
      .its("response.body.responseMeta.status")
      .should("eq", 200);
    cy.wait(3000);

    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    _.deployMode.NavigateBacktoEditor();
  });

  it("2. Selects clear interval function, Fill clearInterval action creator and test code generated", () => {
    _.entityExplorer.SelectEntityByName("Button1", "Widgets");
    _.propPane.DisableJSMode("onClick");
    cy.get(".action-block-tree").click({ force: true });
    cy.get(".t--action-selector-popup .t--delete").click({ force: true });
    _.propPane.SelectPlatformFunction("onClick", "Clear interval");
    _.agHelper.EnterActionValue("Id", "myInterval");

    _.propPane.EnableJSMode("onClick");
    _.propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{clearInterval('myInterval');}}`,
    );
  });
});
