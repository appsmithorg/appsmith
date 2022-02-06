const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/audioWidgetDsl.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Audio Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Audio Widget play functionality validation", function() {
    cy.openPropertyPane("audiowidget");
    cy.widgetText("Audio1", widgetsPage.audioWidget, commonlocators.audioInner);
    cy.get(commonlocators.onPlay).click();
    cy.selectShowMsg();
    cy.addSuccessMessage("Play success");
    cy.get(widgetsPage.autoPlay).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Audio widget pause functionality validation", function() {
    cy.get(commonlocators.onPause).click();
    cy.selectShowMsg();
    cy.addSuccessMessage("Pause success");
    cy.get(widgetsPage.autoPlay).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("Update audio url and check play and pause functionality validation", function() {
    cy.testCodeMirror(testdata.audioUrl);
    cy.get(".CodeMirror textarea")
      .first()
      .blur();
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
