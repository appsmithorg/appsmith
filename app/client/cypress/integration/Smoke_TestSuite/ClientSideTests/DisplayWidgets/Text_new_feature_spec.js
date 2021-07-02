const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/textDsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Text Widget color/font/alignment Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("textwidget");
  });

  it("Text-TextStyle Heading, Text Name Validation", function() {
    //changing the Text Name and verifying
    cy.widgetText(
      this.data.TextName,
      widgetsPage.textWidget,
      widgetsPage.textWidget + " " + commonlocators.widgetNameTag,
    );

    //Changing the text label
    cy.testCodeMirror(this.data.TextLabelValueScrollable);

    cy.ChangeTextStyle(
      this.data.TextHeading,
      commonlocators.headingTextStyle,
      this.data.TextLabelValueScrollable,
    );
    cy.wait("@updateLayout");
    cy.PublishtheApp();
    cy.get(commonlocators.headingTextStyle)
      .should("have.text", this.data.TextLabelValueScrollable)
      .should("have.css", "font-size", "24px");
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Test to validate text format", function() {
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

  it("Test to validate color changes in text and background", function() {
    //Changing the Text Style's and validating
    cy.get(widgetsPage.textColor)
      .first()
      .click({ force: true });
    cy.xpath(widgetsPage.greenColor).click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.wait("@updateLayout");
    cy.readTextDataValidateCSS("color", "rgb(3, 179, 101)");
    cy.get(widgetsPage.textColorInput)
      .clear({ force: true })
      .type("purple", { force: true });
    cy.wait("@updateLayout");
    cy.readTextDataValidateCSS("color", "rgb(128, 0, 128)");
    cy.get(widgetsPage.backgroundColor)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.xpath(widgetsPage.greenColor)
      .first()
      .click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.wait("@updateLayout");
    cy.PublishtheApp();
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("Test to validate text alignment", function() {
    cy.get(widgetsPage.centerAlign)
      .first()
      .click({ force: true });
    cy.readTextDataValidateCSS("text-align", "center");
    cy.get(widgetsPage.rightAlign)
      .first()
      .click({ force: true });
    cy.readTextDataValidateCSS("text-align", "right");
    cy.get(widgetsPage.leftAlign)
      .first()
      .click({ force: true });
    cy.readTextDataValidateCSS("text-align", "left");
    cy.closePropertyPane();
  });

  it("Test to validate enable scroll feature", function() {
    cy.get(".t--property-control-enablescroll .bp3-switch").click({
      force: true,
    });
    cy.wait("@updateLayout");
    cy.get(commonlocators.headingTextStyle).trigger("mouseover", {
      force: true,
    });
    cy.get(commonlocators.headingTextStyle).scrollIntoView({ duration: 2000 });
  });
});
