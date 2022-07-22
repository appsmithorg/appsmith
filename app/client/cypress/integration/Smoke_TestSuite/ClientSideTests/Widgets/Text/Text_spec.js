const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/displayWidgetDsl.json");

describe("Text Widget Functionality", function() {
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
    cy.testCodeMirror(this.data.TextLabelValue);

    cy.ChangeTextStyle(
      this.data.TextHeading,
      commonlocators.headingTextStyle,
      this.data.TextLabelValue,
    );
    cy.wait("@updateLayout");
    cy.PublishtheApp();
    cy.get(commonlocators.headingTextStyle)
      .should("have.text", this.data.TextLabelValue)
      .should("have.css", "font-size", "16px");
  });

  it("Text Email Parsing Validation", function() {
    cy.testCodeMirror("ab.end@domain.com");
    cy.wait("@updateLayout");
    cy.PublishtheApp();
    cy.get(commonlocators.headingTextStyle + " a").should(
      "have.attr",
      "href",
      "mailto:ab.end@domain.com",
    );
  });

  it("Text-TextStyle Label Validation", function() {
    cy.testCodeMirror(this.data.TextLabelValue);
    //Changing the Text Style's and validating
    cy.ChangeTextStyle(
      this.data.TextLabel,
      commonlocators.labelTextStyle,
      this.data.TextLabelValue,
    );
    cy.PublishtheApp();
    cy.get(commonlocators.labelTextStyle)
      .should("have.text", this.data.TextLabelValue)
      .should("have.css", "font-size", "14px");
  });

  it("Text-TextStyle Body Validation", function() {
    cy.ChangeTextStyle(
      this.data.TextBody,
      commonlocators.bodyTextStyle,
      this.data.TextLabelValue,
    );
    cy.PublishtheApp();
    cy.get(commonlocators.bodyTextStyle)
      .should("have.text", this.data.TextLabelValue)
      .should("have.css", "font-size", "20px");
  });

  it("Text widget depends on itself", function() {
    cy.testJsontext("text", `{{${this.data.TextName}}}`);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Cyclic");

    cy.PublishtheApp();
    cy.get(commonlocators.bodyTextStyle).should(
      "have.text",
      `{{${this.data.TextName}}}`,
    );
  });

  afterEach(() => {
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
