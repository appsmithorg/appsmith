const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/textDsl.json");

describe("Text Widget color/font/alignment Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("textwidget");
  });
  it("Test to validate parsing link", function () {
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
    cy.get(".t--property-control-disablelink .bp3-switch").click({
      force: true,
    });
    cy.wait("@updateLayout");
    // check if it's parsed as text
    cy.contains("a", "https://app.appsmith.com").should("not.exist");
    cy.closePropertyPane();
  });

  it("Text-TextStyle Heading, Text Name Validation", function () {
    //changing the Text Name and verifying
    cy.widgetText(
      this.data.TextName,
      widgetsPage.textWidget,
      widgetsPage.widgetNameSpan,
    );

    //Changing the text label
    cy.testCodeMirror(this.data.TextLabelValueScrollable);
    cy.moveToStyleTab();
    cy.ChangeTextStyle(
      this.data.TextHeading,
      commonlocators.headingTextStyle,
      this.data.TextLabelValueScrollable,
    );
    cy.wait("@updateLayout");
    cy.PublishtheApp();
    cy.get(commonlocators.headingTextStyle)
      .should("have.text", this.data.TextLabelValueScrollable)
      .should("have.css", "font-size", "16px");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Test to validate text format", function () {
    cy.moveToStyleTab();
    //Changing the Text Style's and validating
    cy.get(widgetsPage.italics).click({ force: true });
    cy.readTextDataValidateCSS("font-style", "italic");
    cy.get(widgetsPage.bold).click({ force: true });
    cy.readTextDataValidateCSS("font-weight", "400");
    cy.get(widgetsPage.bold).click({ force: true });
    cy.readTextDataValidateCSS("font-weight", "700");
    cy.get(widgetsPage.italics).click({ force: true });
    cy.readTextDataValidateCSS("font-style", "normal");
    cy.closePropertyPane();
  });

  it("Test to validate color changes in text and background", function () {
    cy.moveToStyleTab();
    //Changing the Text Style's and validating
    cy.get(widgetsPage.textColor).first().click({ force: true });
    cy.selectColor("textcolor");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.wait("@updateLayout");
    cy.readTextDataValidateCSS("color", "rgb(126, 34, 206)");
    cy.get(widgetsPage.textColor)
      .clear({ force: true })
      .type("purple", { force: true });
    cy.wait("@updateLayout");
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
      "rgb(126, 34, 206)",
    );

    //Toggle JS check with cell background:
    cy.get(widgetsPage.cellBackgroundToggle).click({ force: true });
    cy.updateCodeInput(widgetsPage.cellBackground, "purple");

    cy.wait("@updateLayout");
    cy.readTextDataValidateCSS("color", "rgb(128, 0, 128)");
  });

  it("Test to validate text alignment", function () {
    cy.get(widgetsPage.centerAlign).first().click({ force: true });
    cy.readTextDataValidateCSS("text-align", "center");
    cy.get(widgetsPage.rightAlign).first().click({ force: true });
    cy.readTextDataValidateCSS("text-align", "right");
    cy.get(widgetsPage.leftAlign).first().click({ force: true });
    cy.readTextDataValidateCSS("text-align", "left");
    cy.closePropertyPane();
  });

  it("Test to validate enable scroll feature", function () {
    cy.moveToContentTab();
    cy.get(".t--button-group-SCROLL").click({ force: true });
    cy.wait("@updateLayout");
    cy.get(commonlocators.headingTextStyle).trigger("mouseover", {
      force: true,
    });
    cy.get(commonlocators.headingTextStyle).scrollIntoView({ duration: 2000 });
    cy.closePropertyPane();
  });
  it("Test border width, color and verity", function () {
    cy.moveToStyleTab();
    cy.testJsontext("borderwidth", "10");
    cy.wait("@updateLayout");
    cy.get(`${widgetsPage.textWidget} .t--text-widget-container`).should(
      "have.css",
      "border-width",
      "10px",
    );
    cy.selectColor("bordercolor");
    cy.readTextDataValidateCSS("border-color", "rgb(228, 228, 231)");
  });
});
