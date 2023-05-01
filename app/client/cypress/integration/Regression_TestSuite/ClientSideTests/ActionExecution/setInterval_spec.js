const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/buttonApiDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const propPane = ObjectsRegistry.PropertyPane;
const agHelper = ObjectsRegistry.AggregateHelper;
const jsEditor = ObjectsRegistry.JSEditor;

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
    cy.SearchEntityandOpen("Button1");
    propPane.SelectPlatformFunction("onClick", "Set interval");
    agHelper.EnterActionValue("Callback function", "{{() => { Api1.run() }}}");
    agHelper.EnterActionValue("Id", "myInterval");
    propPane.EnterJSContext(
      "onClick",
      "{{setInterval(() => {  Api1.run();}, 5000, 'myInterval');}}",
    );

    //Works in the published version"
    cy.PublishtheApp();
    cy.wait(3000);
    cy.get("span:contains('Submit')").closest("div").click();
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(3000);

    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("2. Selects clear interval function, Fill clearInterval action creator and test code generated", () => {
    cy.SearchEntityandOpen("Button1");
    jsEditor.DisableJSContext("onClick");
    cy.get(".action-block-tree").click({ force: true });
    cy.get(".t--action-selector-popup .t--delete").click({ force: true });
    propPane.SelectPlatformFunction("onClick", "Clear interval");
    agHelper.EnterActionValue("Id", "myInterval");

    jsEditor.EnableJSContext("onClick");
    propPane.ValidatePropertyFieldValue(
      "onClick",
      `{{clearInterval('myInterval');}}`,
    );
  });
});
