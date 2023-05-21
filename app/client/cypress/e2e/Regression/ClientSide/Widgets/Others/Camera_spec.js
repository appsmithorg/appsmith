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

  it("Check isDirty, onImageSave, imageBlobURL, imageDataURL", () => {
    const mainControlSelector =
      "//div[contains(@class, 't--widget-camerawidget')]//button";

    cy.get(".t--property-control-onimagecapture .t--js-toggle").click();

    cy.testJsontext("onimagecapture", "{{showAlert('captured','success')}}");

    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{Camera1.isDirty}}:{{Camera1.imageDataURL}}:{{Camera1.imageBlobURL}}`,
    );
    // Initial value of isDirty should be false
    cy.get(".t--widget-textwidget").should(
      "contain",
      "false:undefined:undefined",
    );
    // Take photo
    cy.xpath(mainControlSelector).eq(2).click(); //taking photo
    cy.wait(2000);
    // Save photo
    cy.xpath(mainControlSelector).eq(2).click(); //saving it

    // Assert: should trigger onImageSave action
    cy.validateToastMessage("captured");

    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget")
      .invoke("text")
      .should(
        "match",
        /true:blob:[a-z0-9-]*\?type=Base64:blob:https?:\/\/[^/]*\/[a-z0-9-]*/,
      );
  });
});
