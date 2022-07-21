const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");

const pageid = "MyPage";

describe("Entity explorer Drag and Drop widgets testcases", function() {
  it("Drag and drop form widget and validate", function() {
    cy.log("Login Successful");
    cy.reload(); // To remove the rename tooltip
    cy.get(explorer.addWidget).click({ force: true });
    cy.get(commonlocators.entityExplorersearch).should("be.visible");
    cy.get(commonlocators.entityExplorersearch)
      .clear()
      .type("form");
    cy.dragAndDropToCanvas("formwidget", { x: 300, y: 80 });
    cy.get(formWidgetsPage.formD).click();
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
    cy.selectColor("backgroundcolor");
    cy.get(formWidgetsPage.formD)
      .should("have.css", "background-color")
      .and("eq", "rgb(126, 34, 206)");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(commonlocators.scrollView);
    cy.get(formWidgetsPage.formD)
      .scrollTo("bottom")
      .should("be.visible");
    cy.get(explorer.explorerSwitchId).click();
    cy.PublishtheApp();
    cy.get(publish.backToEditor)
      .first()
      .click();
    cy.CheckAndUnfoldEntityItem("WIDGETS");
    cy.get(`.t--entity-name:contains(FormTest)`).trigger("mouseover");
    cy.hoverAndClickParticularIndex(1);
    cy.selectAction("Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(3);
      expect($lis.eq(0)).to.contain("{{FormTest.isVisible}}");
      expect($lis.eq(1)).to.contain("{{FormTest.data}}");
      expect($lis.eq(2)).to.contain("{{FormTest.hasChanges}}");
    });
  });
});
