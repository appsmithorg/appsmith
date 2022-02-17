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
    const widgetName = `camerawidget`;
    const modalName = `modal`;
    const mainControlSelector = `.t--widget-${widgetName} [class*="MainControlContainer"] button`;

    cy.createModal(modalName);
    // Take photo
    cy.get(mainControlSelector).click();
    cy.wait(2000);
    // Save photo
    cy.get(mainControlSelector)
      .first()
      .click();

    // Assert: should trigger onImageSave action - modal popup
    cy.get(modalWidgetPage.modelTextField).should("have.text", modalName);
  });
});
