const dsl = require("../../../../fixtures/MultipleWidgetDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
import { entityExplorer } from "../../../../support/Objects/ObjectsCore";

describe("Binding the multiple widgets and validating default data", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Input widget test with default value from table widget", function () {
    entityExplorer.SelectEntityByName("Input1");
    cy.testJsontext("defaultvalue", testdata.defaultInputWidget + "}}");

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    //Dropdown widget test with default value from table widget
    entityExplorer.SelectEntityByName("Dropdown1");
    cy.testJsontext("options", JSON.stringify(testdata.deafultDropDownWidget));

    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("2. validation of default data displayed in all widgets based on row selected", function () {
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("2736212");
      cy.log("the value is" + tabValue);

      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
    });

    cy.readTabledataPublish("1", "1").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("lindsay.ferguson@reqres.in");
      cy.log("the value is" + tabValue);
      cy.get(widgetsPage.defaultSingleSelectValue)
        .first()
        .invoke("text")
        .then((text) => {
          const someText = text;
          expect(someText).to.equal(tabValue);
        });
    });
  });
});
