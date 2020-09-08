const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
const explorer = require("../../../locators/explorerlocators.json");
const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const publish = require("../../../locators/publishWidgetspage.json");

const pageid = "MyPage";

describe("Entity explorer Drag and Drop widgets testcases", function() {
  it("Drag and drop form widget and validate", function() {
    cy.log("Login Successful");
    cy.get(explorer.addWidget).click();
    cy.get(commonlocators.entityExplorersearch).should("be.visible");
    cy.get(commonlocators.entityExplorersearch)
      .clear()
      .type("form");
    cy.dragAndDropToCanvas("formwidget");
    /**
     * @param{Text} Random Text
     * @param{FormWidget}Mouseover
     * @param{FormPre Css} Assertion
     */
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      formWidgetsPage.formInner,
    );
    /**
     * @param{Text} Random Colour
     */
    cy.testCodeMirror(this.data.colour);
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", this.data.rgbValue);
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(commonlocators.scrollView);
    cy.get(formWidgetsPage.formD)
      .scrollTo("bottom")
      .should("be.visible");
    cy.get(commonlocators.editPropCrossButton).click();
    cy.get(explorer.closeWidgets).click();
    cy.PublishtheApp();
    cy.get(publish.backToEditor)
      .first()
      .click();
    cy.SearchEntityandOpen("FormTest");
    cy.get(explorer.property)
      .last()
      .click({ force: true });
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{FormTest.isVisible}}");
      expect($lis.eq(1)).to.contain("{{FormTest.data}}");
    });
  });
});
