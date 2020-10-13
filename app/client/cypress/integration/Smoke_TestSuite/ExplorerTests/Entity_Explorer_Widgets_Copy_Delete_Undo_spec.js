const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
const explorer = require("../../../locators/explorerlocators.json");
const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/formWidgetdsl.json");

const pageid = "MyPage";

before(() => {
  cy.addDsl(dsl);
});

describe("Test Suite to validate copy/delete/undo functionalites", function() {
  it("Drag and drop form widget and validate copy widget via toast message", function() {
    cy.openPropertyPane("formwidget");
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      formWidgetsPage.formInner,
    );
    cy.get(commonlocators.copyWidget).click();
    cy.wait(500);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Copied");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  it("Delete Widget from sidebar and Undo action validation", function() {
    cy.GlobalSearchEntity("FormTest");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{FormTest.isVisible}}");
      expect($lis.eq(1)).to.contain("{{FormTest.data}}");
    });
    cy.DeleteWidgetFromSideBar();
    cy.wait(500);
    cy.get(apiwidget.propertyList).should("not.be.visible");
    /*
    To be enabled once widget delete click works
    cy.get('.t--delete-widget')
      .trigger("mouseover")
      .click({ force: true });
      */
    cy.get(commonlocators.toastAction).should("be.visible");
    cy.get(commonlocators.toastAction)
      .contains("UNDO")
      .click({ force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.wait(500);
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{FormTest.isVisible}}");
      expect($lis.eq(1)).to.contain("{{FormTest.data}}");
    });
  });
});
