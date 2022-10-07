const modalWidgetPage = require("../../../../../locators/ModalWidget.json");
const dsl = require("../../../../../fixtures/CameraDsl.json");

describe("Camera Widget", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("camerawidget");
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });

  it("Check isDirty, onImageSave", () => {
    const modalName = `modal`;
    const mainControlSelector =
      "//div[contains(@class, 't--widget-camerawidget')]//button";

    cy.createModal(modalName);
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(".t--property-control-text", "{{Camera1.isDirty}}");
    // Initial value of isDirty should be false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Take photo
    cy.xpath(mainControlSelector)
      .eq(2)
      .click(); //taking photo
    cy.wait(2000);
    // Save photo
    cy.xpath(mainControlSelector)
      .eq(2)
      .click(); //saving it

    // Assert: should trigger onImageSave action - modal popup
    cy.get(modalWidgetPage.modelTextField).should("have.text", modalName);
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
  });
});
