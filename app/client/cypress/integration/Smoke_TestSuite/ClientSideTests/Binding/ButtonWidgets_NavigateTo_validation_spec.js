const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/buttondsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
const dsl2 = require("../../../../fixtures/displayWidgetDsl.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Binding the button Widgets and validating NavigateTo Page functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Button widget with action navigate to page", function() {
    cy.openPropertyPane("buttonwidget");
    cy.get(widgetsPage.actionSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Navigate To")
      .click();
    cy.enterNavigatePageName(testdata.externalPage);
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
  });

  it("Button click should take the control to page link validation", function() {
    cy.PublishtheApp();
    cy.get(publish.buttonWidget).click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(publish.buttonWidget).should("not.exist");
    cy.go("back");
    cy.get(publish.backToEditor)
      .first()
      .click();
    cy.wait("@getPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
