const dsl = require("../../../../../fixtures/listRegressionDsl.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

let propPane = ObjectsRegistry.PropertyPane;

describe("Binding the list widget with text widget", function() {
  //const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Validate text widget data based on changes in list widget Data1", function() {
    cy.PublishtheApp();
    cy.wait(2000);
    cy.get(".t--widget-textwidget span:contains('Vivek')").should(
      "have.length",
      1,
    );
    cy.get(".t--widget-textwidget span:contains('Pawan')").should(
      "have.length",
      1,
    );
    cy.get(publish.backToEditor).click({ force: true });
    cy.get(".t--text-widget-container:contains('Vivek')").should(
      "have.length",
      1,
    );
    cy.get(".t--text-widget-container:contains('Vivek')").should(
      "have.length",
      1,
    );
  });

  it("2. Validate text widget data based on changes in list widget Data2", function() {
    cy.SearchEntityandOpen("List1");
    propPane.UpdatePropertyFieldValue(
      "Items",
      '[[{ "name": "pawan"}, { "name": "Vivek" }], [{ "name": "Ashok"}, {"name": "rahul"}]]',
    );
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.SearchEntityandOpen("Text3");
    cy.wait(1000);
    propPane.UpdatePropertyFieldValue(
      "Text",
      '{{currentItem.map(item => item.name).join(", ")}}',
    );
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.PublishtheApp();
    cy.wait(2000);
    cy.get(".t--widget-textwidget span:contains('pawan, Vivek')").should(
      "have.length",
      1,
    );
    cy.get(".t--widget-textwidget span:contains('Ashok, rahul')").should(
      "have.length",
      1,
    );
    cy.get(publish.backToEditor).click({ force: true });
  });

  it("3. Validate text widget data based on changes in list widget Data3", function() {
    cy.SearchEntityandOpen("List1");
    propPane.UpdatePropertyFieldValue(
      "Items",
      '[{ "name": "pawan"}, { "name": "Vivek" }]',
    );
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.SearchEntityandOpen("Text3");
    cy.wait(1000);
    propPane.UpdatePropertyFieldValue("Text", "{{currentItem.name}}");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.PublishtheApp();
    cy.wait(2000);
    cy.get(".t--widget-textwidget span:contains('Vivek')").should(
      "have.length",
      2,
    );
    cy.get(".t--widget-textwidget span:contains('pawan')").should(
      "have.length",
      2,
    );
    cy.get(publish.backToEditor).click({ force: true });
  });

  it("4. Validate delete widget action from side bar", function() {
    cy.openPropertyPane("listwidget");
    cy.verifyUpdatedWidgetName("Test");
    cy.get(commonlocators.editWidgetName)
      .click({ force: true })
      .type("#$%1234", { delay: 300 })
      .type("{enter}");
    cy.get(".t--widget-name").contains("___1234");
    cy.verifyUpdatedWidgetName("12345");
    cy.get(".t--delete-widget").click({ force: true });
    cy.get(".t--toast-action span")
      .eq(0)
      .contains("12345 is removed");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
