const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  agHelper,
  deployMode,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Text Widget color/font/alignment Functionality",
  { tags: ["@tag.Widget", "@tag.Text", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("textDsl");
    });

    beforeEach(() => {
      cy.openPropertyPane("textwidget");
    });
    it("1. Test to validate parsing link", function () {
      // Add link to text widget
      cy.testCodeMirror("app.appsmith.com");
      // check if it's a link when no http or https is passed,
      cy.get(`${commonlocators.headingTextStyle} a`).should(
        "have.attr",
        "href",
        "http://app.appsmith.com",
      );

      // Add link to text widget
      cy.testCodeMirror("https://app.appsmith.com");
      // check if it's parsed as link
      cy.get(commonlocators.headingTextStyle);
      cy.contains("a", "https://app.appsmith.com").should(
        "have.attr",
        "href",
        "https://app.appsmith.com",
      );
      // disable parsing as link
      cy.get(".t--property-control-disablelink input").click({
        force: true,
      });
      cy.wait("@updateLayout");
      // check if it's parsed as text
      cy.contains("a", "https://app.appsmith.com").should("not.exist");
      cy.closePropertyPane();
    });

    it("2. Text-TextStyle Heading, Text Name Validation", function () {
      //changing the Text Name and verifying
      cy.widgetText(
        this.dataSet.TextName,
        widgetsPage.textWidget,
        widgetsPage.widgetNameSpan,
      );

      //Changing the text label
      cy.testCodeMirror(this.dataSet.TextLabelValueScrollable);
      cy.moveToStyleTab();
      cy.ChangeTextStyle(
        this.dataSet.TextHeading,
        commonlocators.headingTextStyle,
        this.dataSet.TextLabelValueScrollable,
      );
      cy.wait("@updateLayout");
      deployMode.DeployApp();
      cy.get(commonlocators.headingTextStyle)
        .should("have.text", this.dataSet.TextLabelValueScrollable)
        .should("have.css", "font-size", "16px");
      deployMode.NavigateBacktoEditor();
    });

    it("3. Test to validate text format", function () {
      cy.moveToStyleTab();
      //Changing the Text Style's and validating
      cy.get(widgetsPage.italics).click();
      cy.readTextDataValidateCSS("font-style", "italic");
      cy.get(widgetsPage.bold).click();
      cy.readTextDataValidateCSS("font-weight", "400");
      cy.get(widgetsPage.bold).click();
      cy.readTextDataValidateCSS("font-weight", "700");
      cy.get(widgetsPage.italics).click();
      cy.readTextDataValidateCSS("font-style", "normal");
      cy.closePropertyPane();
    });

    it("4. Test to validate color changes in text and background", function () {
      cy.moveToStyleTab();
      //Changing the Text Style's and validating
      cy.get(widgetsPage.textColor).first().click({ force: true });
      cy.selectColor("textcolor");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.wait("@updateLayout");
      cy.readTextDataValidateCSS("color", "rgb(219, 234, 254)");
      propPane.EnterJSContext("Text color", "purple");
      agHelper.Sleep(1000);
      cy.readTextDataValidateCSS("color", "rgb(128, 0, 128)");

      //Checks the cell background with color picker
      cy.get(`${widgetsPage.cellBackground} input`)
        .first()
        .click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.selectColor("backgroundcolor");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.wait("@updateLayout");
      cy.get(`${widgetsPage.textWidget} .bp3-ui-text`).should(
        "have.css",
        "background-color",
        "rgb(219, 234, 254)",
      );

      //Toggle JS check with cell background:
      propPane.EnterJSContext("Background color", "purple");
      cy.readTextDataValidateCSS("color", "rgb(128, 0, 128)");
    });

    it("5. Test to validate text alignment", function () {
      cy.xpath(widgetsPage.textCenterAlign).first().click({ force: true });
      cy.readTextDataValidateCSS("text-align", "center");
      cy.xpath(widgetsPage.rightAlign).first().click({ force: true });
      cy.readTextDataValidateCSS("text-align", "right");
      cy.xpath(widgetsPage.leftAlign).first().click({ force: true });
      cy.readTextDataValidateCSS("text-align", "left");
      cy.closePropertyPane();
    });

    it("6. Test to validate enable scroll feature", function () {
      cy.moveToContentTab();
      cy.get("[data-value='SCROLL']").click({ force: true });
      cy.wait("@updateLayout");
      cy.get(commonlocators.headingTextStyle).trigger("mouseover", {
        force: true,
      });
      cy.get(commonlocators.headingTextStyle).scrollIntoView({
        duration: 2000,
      });
      cy.closePropertyPane();
    });
    it("7. Test border width, color and verity", function () {
      cy.moveToStyleTab();
      cy.testJsontext("borderwidth", "10");
      cy.wait("@updateLayout");
      cy.get(`${widgetsPage.textWidget} .t--text-widget-container`).should(
        "have.css",
        "border-width",
        "10px",
      );
      cy.selectColor("bordercolor");
      cy.readTextDataValidateCSS("border-color", "rgb(205, 213, 223)");
    });
  },
);
