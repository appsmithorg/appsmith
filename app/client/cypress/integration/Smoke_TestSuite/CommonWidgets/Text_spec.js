const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publishPage = require("../../../locators/publishWidgetspage.json");

describe("Text Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("textwidget");
  });

  it("Text-TextStyle Heading, Text Name Validation", function() {
    //Changing the text label
    cy.testCodeMirror(this.data.TextLabelValue);

    //changing the Text Name and verifying
    cy.widgetText(
      this.data.TextName,
      widgetsPage.textWidget,
      widgetsPage.textWidget + " pre",
    );

    cy.ChangeTextStyle(
      this.data.TextHeading,
      commonlocators.headingTextStyle,
      this.data.TextLabelValue,
    );
    cy.PublishtheApp();
    cy.get(commonlocators.headingTextStyle).should(
      "have.text",
      this.data.TextLabelValue,
    );
  });

  it("Text-TextStyle Label Validation", function() {
    //Changing the Text Style's and validating
    cy.ChangeTextStyle(
      this.data.TextLabel,
      commonlocators.labelTextStyle,
      this.data.TextLabelValue,
    );
    cy.PublishtheApp();
    cy.get(commonlocators.labelTextStyle).should(
      "have.text",
      this.data.TextLabelValue,
    );
  });

  it("Text-TextStyle Body Validation", function() {
    cy.ChangeTextStyle(
      this.data.TextBody,
      commonlocators.bodyTextStyle,
      this.data.TextLabelValue,
    );
    cy.PublishtheApp();
    cy.get(commonlocators.bodyTextStyle).should(
      "have.text",
      this.data.TextLabelValue,
    );
  });

  afterEach(() => {
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
