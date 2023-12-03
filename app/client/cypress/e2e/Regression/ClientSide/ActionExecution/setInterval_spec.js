import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";
import data from "../../../../fixtures/TestDataSet1.json";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Test Create Api and Bind to Button widget", function () {
  before("Test_Add users api and execute api", () => {
    agHelper.AddDsl("buttonApiDsl");
    cy.createAndFillApi(data.userApi, "/mock-api?records=10");
    cy.RunAPI();
  });

  it("1. Selects set interval function, Fill setInterval action creator and test code generated ", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.SelectPlatformFunction("onClick", "Set interval");
    agHelper.EnterActionValue("Callback function", "{{() => { Api1.run() }}}");
    agHelper.EnterActionValue("Id", "myInterval");
    propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {  Api1.run();}, 5000, 'myInterval');}}",
    );

    //Works in the published version"
    deployMode.DeployApp();
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
    deployMode.NavigateBacktoEditor();
  });

  it("2. Selects clear interval function, Fill clearInterval action creator and test code generated", () => {
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.ToggleJSMode("onClick", false);
    cy.get(".action-block-tree").click({ force: true });
    cy.get(".t--action-selector-popup .t--delete").click({ force: true });
    propPane.SelectPlatformFunction("onClick", "Clear interval");
    agHelper.EnterActionValue("Id", "myInterval");

    propPane.ToggleJSMode("onClick");
    propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{clearInterval('myInterval');}}`,
    );
  });
});
