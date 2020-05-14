const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");
const homePage = require("../../../locators/HomePage.json");

describe("Button Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Button Widget Functionality", function() {
    cy.get(".t--nav-link-widgets-editor").click();
    cy.openPropertyPane("buttonwidget");

    //changing the Button Name
    cy.widgetText(
      this.data.ButtonName,
      widgetsPage.buttonWidget,
      widgetsPage.buttonWidget + " pre",
    );

    //Changing the text on the Button
    cy.testCodeMirror(this.data.ButtonLabel);
    cy.xpath(homePage.homePageID).contains("All changes saved");

    //Verify the Button name and label
    cy.get(widgetsPage.buttonWidget).trigger("mouseover");
    cy.get(widgetsPage.buttonWidget + " span.bp3-button-text").should(
      "have.text",
      this.data.ButtonLabel,
    );

    //Check the disableed checkbox and Validate
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);
    cy.get(widgetsPage.buttonWidget + " .bp3-minimal.bp3-disabled").should(
      "exist",
    );

    // //UnCheck the disabled checkbox and validate
    cy.UnCheckWidgetProperties(commonlocators.disableCheckbox);
    cy.get(widgetsPage.buttonWidget + " .bp3-minimal.bp3-disabled").should(
      "not.exist",
    );

    //creating the Alert Modal and verify Modal name
    cy.createModal("Alert Modal", this.data.AlertModalName);

    //creating the Form Modal and verify Modal name
    cy.openPropertyPane("buttonwidget");
    cy.createModal("Form Modal", this.data.FormModalName);
  });

  afterEach(() => {
    //clean up
    //  cy.DeleteModal();
  });
});
