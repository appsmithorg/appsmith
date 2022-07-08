const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/videoWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Video Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Video Widget play functionality validation", function() {
    cy.openPropertyPane("videowidget");
    cy.widgetText("Video1", widgetsPage.videoWidget, commonlocators.videoInner);
    cy.get(commonlocators.onPlay).click();
    cy.selectShowMsg();
    cy.addSuccessMessage("Play success");
    cy.get(widgetsPage.autoPlay).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Play success");
    */
  });

  it("Video widget pause functionality validation", function() {
    cy.get(commonlocators.onPause).click();
    cy.selectShowMsg();
    cy.addSuccessMessage("Pause success");
    cy.get(widgetsPage.autoPlay).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Pause success");
    */
  });

  it("Update video url and check play and pause functionality validation", function() {
    cy.testCodeMirror(testdata.videoUrl);
    cy.get(".CodeMirror textarea")
      .first()
      .blur();
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Play success");
    */
    cy.get(widgetsPage.autoPlay).click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    /*
    cy.wait(4000);
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Pause success");
    */
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
