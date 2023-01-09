const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/audioWidgetDsl.json");
const testdata = require("../../../../../fixtures/testdata.json");

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

  it("Checks if audio widget is reset on button click", function() {
    cy.dragAndDropToCanvas("buttonwidget", { x: 300, y: 300 });
    cy.openPropertyPane("buttonwidget");
    cy.widgetText(
      "Button1",
      widgetsPage.buttonWidget,
      commonlocators.buttonInner,
    );
    cy.get(commonlocators.onClick).click();
    cy.selectResetWidget();
    cy.selectWidgetForReset("Audio1");

    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", `{{Audio1.playState}}`);

    cy.openPropertyPane("audiowidget");
    cy.get(widgetsPage.autoPlay).click({ force: true });
    // Wait time added, allowing a second to pass between playing and pausing the widget, before it is reset to zero
    cy.wait(1000);
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.get(widgetsPage.widgetBtn).click({ force: true });
    cy.wait(1000);
    cy.get(`${widgetsPage.audioWidget} audio`).then(($audio) => {
      const audio = $audio.get(0);
      expect(audio.currentTime).to.equal(0);
    });
    cy.get(".t--widget-textwidget").should("contain", "NOT_STARTED");
  });
});
