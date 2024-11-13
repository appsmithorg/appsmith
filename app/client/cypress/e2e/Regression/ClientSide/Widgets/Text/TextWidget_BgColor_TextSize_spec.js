const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Text Widget Cell Background and Text Size Validation",
  { tags: ["@tag.Widget", "@tag.Text", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("textWidgetDsl");
    });
    it("Change the cell background color", function () {
      cy.openPropertyPane("textwidget");
      cy.moveToStyleTab();
      /**
       * @param{Text} Random Text
       * @param{CheckboxWidget}Mouseover
       * @param{CheckboxPre Css} Assertion
       */

      //Check if the cell background is #03b365
      cy.selectColor("backgroundcolor");

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.css",
        "background-color",
        "rgb(219, 234, 254)",
      );

      //Toggle to JS mode
      cy.get(widgetsPage.cellBackgroundToggle).click().wait(200);

      //Check if the typed color red is reflecting in the background color and in the evaluated value
      cy.updateCodeInput(widgetsPage.cellBackground, "red");

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.css",
        "background-color",
        "rgb(255, 0, 0)",
      );

      cy.EvaluateCurrentValue("red");

      //Check if the typed color #03b365 is reflecting in the background color and in the evaluated value
      cy.updateCodeInput(widgetsPage.cellBackground, "#03b365");

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.css",
        "background-color",
        "rgb(3, 179, 101)",
      );

      cy.EvaluateCurrentValue("#03b365");

      //Check if the typed color transparent is reflecting in the background color and in the evaluated value
      cy.updateCodeInput(widgetsPage.cellBackground, "");

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.css",
        "background-color",
        "rgba(0, 0, 0, 0)",
      );

      cy.get(commonlocators.evaluatedCurrentValue).should("not.exist");
    });

    it("Change the text sizes", function () {
      cy.openPropertyPane("textwidget");
      cy.moveToStyleTab();

      //Check the label text size with dropdown
      cy.get(widgetsPage.textSizeNew).last().click({ force: true });

      cy.wait(100);
      cy.selectTextSize("S");

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.css",
        "font-size",
        "14px",
      );

      //Toggle JS mode
      cy.get(widgetsPage.toggleTextSizeNew).click().wait(200);

      //Check if the typed size HEADING2 is reflecting in the background color and in the evaluated value
      cy.updateCodeInput(".t--property-control-fontsize", "18px");
      cy.focused().blur();

      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.css",
        "font-size",
        "18px",
      );

      //Check for if the text size changes to default size when set to blank in JS mode:
      cy.updateCodeInput(".t--property-control-fontsize", "");
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.css",
        "font-size",
        "16px",
      );

      cy.get(commonlocators.evaluatedCurrentValue).should("not.exist");
    });
  },
);
