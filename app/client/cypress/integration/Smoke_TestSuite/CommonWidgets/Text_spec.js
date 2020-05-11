const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");

describe("Text Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Text Widget Functionality", function() {
    cy.openPropertyPane("textwidget");

    //Changing the text label
    cy.testCodeMirror(this.data.TextLabelValue);

    //changing the Text Name and verifying
    cy.widgetText(
      this.data.TextName,
      widgetsPage.textWidget,
      widgetsPage.textWidget + " pre",
    );

    //Changing the Text Style's and validating
    cy.ChangeTextStyle(
      this.data.TextLabel,
      commonlocators.labelTextStyle,
      this.data.TextLabelValue,
    );

    cy.ChangeTextStyle(
      this.data.TextBody,
      commonlocators.bodyTextStyle,
      this.data.TextLabelValue,
    );

    cy.ChangeTextStyle(
      this.data.TextHeading,
      commonlocators.headingTextStyle,
      this.data.TextLabelValue,
    );
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
