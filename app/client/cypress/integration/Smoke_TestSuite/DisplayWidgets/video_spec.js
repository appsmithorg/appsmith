const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/videoWidgetDsl.json");
const pages = require("../../../locators/Pages.json");

describe("Table Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table Widget Functionality", function() {
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
    cy.get(commonlocators.toastMsg).should("be.visible");
    cy.get(commonlocators.toastMsg).contains("Play success");
  });
  afterEach(() => {
    // put your clean up code if any
  });
});
