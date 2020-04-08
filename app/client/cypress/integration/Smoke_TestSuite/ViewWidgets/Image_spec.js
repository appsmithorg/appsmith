const commonlocators = require("../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../locators/ViewWidgets.json");

context("Cypress test", function() {
  it("Image Widget Functionality", function() {
    cy.NavigateToViewWidgets();
    cy.get(viewWidgetsPage.imageWidget)
      .first()
      .trigger("mouseover");
    cy.get(viewWidgetsPage.imageWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });
    //Checking the edit props for Image and also the properties of Image widget
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .clear({ force: true })
      .should("be.empty")
      .type(
        "https://images.pexels.com/photos/60597/dahlia-red-blossom-bloom-60597.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      );
    cy.get(".CodeMirror textarea")
      .first()
      .should(
        "have.value",
        "https://images.pexels.com/photos/60597/dahlia-red-blossom-bloom-60597.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      );
    cy.get(commonlocators.editPropCrossButton).click();
  });
});
