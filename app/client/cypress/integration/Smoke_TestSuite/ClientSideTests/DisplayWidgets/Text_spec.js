const commonlocators = require("../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");

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
      .should("have.css", "font-size", "24px");
  });

  it("Text-TextStyle Label Validation", function() {
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
      .should("have.css", "font-size", "18px");
  });

  it("Text widget depends on itself", function() {
    cy.getCodeMirror().then(($cm) => {
      if ($cm.val() !== "") {
        cy.get(".CodeMirror textarea")
          .first()
          .clear({
            force: true,
          });
      }

      cy.get(".CodeMirror textarea")
        .first()
        .type(`{{${this.data.TextName}}}`, {
          force: true,
          parseSpecialCharSequences: false,
        });
    });
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
