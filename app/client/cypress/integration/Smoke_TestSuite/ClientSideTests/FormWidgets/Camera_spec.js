const modalWidgetPage = require("../../../../locators/ModalWidget.json");
const dsl = require("../../../../fixtures/CameraDsl.json");

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

  it("Property: onImageSave, show modal", () => {
    const modalName = `modal`;
    const mainControlSelector =
      "//div[contains(@class, 't--widget-camerawidget')]//button";

    cy.createModal(modalName);
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
  });
});
