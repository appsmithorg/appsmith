const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Checkbox Widget Functionality",
  { tags: ["@tag.All", "@tag.Form", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formWidgetdsl");
    });

    it("1. Checkbox Functionality To Check required toggle for form", function () {
      cy.openPropertyPane("checkboxwidget");
      _.agHelper.CheckUncheck(commonlocators.requiredjs + " " + "input");
      _.deployMode.DeployApp();
      cy.wait(2000);
      cy.get(publish.checkboxWidget).click();
      cy.get('[type="checkbox"]').eq(0).should("not.be.checked");
      cy.get(widgetsPage.formButtonWidget)
        .contains("Submit")
        .should("have.class", "bp3-disabled");

      cy.get(publish.checkboxWidget).click();
      cy.get(widgetsPage.formButtonWidget)
        .contains("Submit")
        .should("not.have.attr", "disabled");

      _.deployMode.NavigateBacktoEditor();
    });

    it("2. Checkbox Functionality To swap label alignment of checkbox", function () {
      cy.openPropertyPane("checkboxwidget");
      cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
        "have.css",
        "text-align",
        "left",
      );

      // align right
      cy.get("[data-value='RIGHT']").first().click();
      cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
        "have.css",
        "text-align",
        "right",
      );
      cy.wait(200);
      _.deployMode.DeployApp();
      cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
        "have.css",
        "text-align",
        "right",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("3. Checkbox Functionality To swap label position of checkbox", function () {
      cy.openPropertyPane("checkboxwidget");
      cy.get(publish.checkboxWidget + " " + ".bp3-align-right").should(
        "not.exist",
      );

      cy.get(publish.checkboxWidget + " " + ".bp3-align-left").should("exist");
      cy.get(commonlocators.optionposition).last().click({ force: true });
      cy.wait(200);
      cy.get("[data-value='Left']").click({ force: true });
      cy.wait(200);
      _.deployMode.DeployApp();

      // When Label Position is Left, checkbox is on the right
      cy.get(publish.checkboxWidget + " " + ".bp3-align-right").should("exist");
      cy.get(publish.checkboxWidget + " " + ".bp3-align-left").should(
        "not.exist",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("4. Checkbox Functionality To change label color of checkbox", function () {
      cy.openPropertyPane("checkboxwidget");
      cy.moveToStyleTab();
      cy.get(".t--property-control-fontcolor .bp3-input").type("red");
      cy.wait(200);
      _.deployMode.DeployApp();
      cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
        "have.css",
        "color",
        "rgb(255, 0, 0)",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("5. Checkbox Functionality To change label size of checkbox", function () {
      cy.openPropertyPane("checkboxwidget");
      cy.moveToStyleTab();
      cy.get(widgetsPage.textSizeNew).last().click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000);
      cy.selectTxtSize("XL");
      _.deployMode.DeployApp();
      cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
        "have.css",
        "font-size",
        "30px",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("6. Checkbox Functionality To change label style of checkbox", function () {
      cy.openPropertyPane("checkboxwidget");
      cy.moveToStyleTab();
      cy.get(".t--property-control-emphasis .t--button-group-BOLD").click();
      _.deployMode.DeployApp();
      cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
        "have.css",
        "font-weight",
        "700",
      );
      _.deployMode.NavigateBacktoEditor();
    });
  },
);
afterEach(() => {
  // put your clean up code if any
});
