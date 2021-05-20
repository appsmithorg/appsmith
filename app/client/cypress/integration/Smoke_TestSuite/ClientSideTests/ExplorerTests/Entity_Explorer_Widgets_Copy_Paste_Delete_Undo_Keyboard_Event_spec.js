const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/formWidgetdsl.json");

const pageid = "MyPage";
before(() => {
  cy.addDsl(dsl);
});

describe("Test Suite to validate copy/delete/undo functionalites", function() {
  it("Drag and drop form widget and validate copy widget via toast message", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

    cy.openPropertyPane("formwidget");
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      formWidgetsPage.formInner,
    );
    cy.get("body").click();
    cy.get("body").type(`{${modifierKey}}c`);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Copied")
      .click();
    cy.get("body").type(`{${modifierKey}}v`, { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get("body").type("{del}", { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(commonlocators.toastAction).should("be.visible");
    cy.get(commonlocators.toastAction)
      .contains("UNDO")
      .click({ force: true });
    cy.GlobalSearchEntity("FormTestCopy");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{FormTestCopy.isVisible}}");
      expect($lis.eq(1)).to.contain("{{FormTestCopy.data}}");
    });
  });
});
