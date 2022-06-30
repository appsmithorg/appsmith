const dsl = require("../../../../fixtures/listRegressionDsl.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let jsEditor = ObjectsRegistry.JSEditor;

describe("Binding the list widget with text widget", function() {
  //const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate text widget data based on changes in list widget Data1", function() {
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

  it("Validate text widget data based on changes in list widget Data2", function() {
    cy.SearchEntityandOpen("List1");
    jsEditor.EnterJSContext(
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
    jsEditor.EnterJSContext(
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

  it("Validate text widget data based on changes in list widget Data3", function() {
    cy.SearchEntityandOpen("List1");
    jsEditor.EnterJSContext(
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
    jsEditor.EnterJSContext("Text", "{{currentItem.name}}");
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

  it("Validate delete widget action from side bar", function() {
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
