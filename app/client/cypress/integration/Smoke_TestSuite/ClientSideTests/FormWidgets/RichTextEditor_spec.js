const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/formdsl1.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");

describe("RichTextEditor Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.wait(7000);
    cy.openPropertyPane("richtexteditorwidget");
  });

  it("RichTextEditor-Edit Text area with HTML body functionality", function() {
    //changing the Text Name
    cy.widgetText(
      this.data.RichTextEditorName,
      formWidgetsPage.richTextEditorWidget,
      formWidgetsPage.richTextEditorWidget + " " + commonlocators.widgetNameTag,
    );

    //Edit the text area with Html
    cy.testJsontext("defaulttext", this.data.HtmlText);

    //Validate Html
    cy.validateHTMLText(
      formWidgetsPage.richTextEditorWidget,
      "h1",
      "This is a Heading",
    );
    cy.PublishtheApp();
    cy.validateHTMLText(
      publishPage.richTextEditorWidget,
      "h1",
      "This is a Heading",
    );
  });

  it("RichTextEditor-Enable Validation", function() {
    //Uncheck the Disabled checkbox
    cy.UncheckWidgetProperties(formWidgetsPage.disableJs);
    cy.validateEnableWidget(
      formWidgetsPage.richTextEditorWidget,
      commonlocators.disabledBtn,
    );

    cy.PublishtheApp();
    cy.validateEnableWidget(
      publishPage.richTextEditorWidget,
      commonlocators.disabledBtn,
    );
  });

  it("RichTextEditor-Disable Validation", function() {
    //Check the Disabled checkbox
    cy.CheckWidgetProperties(formWidgetsPage.disableJs);
    cy.validateDisableWidget(
      formWidgetsPage.richTextEditorWidget,
      commonlocators.disabledBtn,
    );

    cy.PublishtheApp();
    cy.validateDisableWidget(
      publishPage.richTextEditorWidget,
      commonlocators.disabledBtn,
    );
  });

  it("RichTextEditor-check Visible field  validation", function() {
    // Uncheck the visible checkbox
    cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publishPage.richTextEditorWidget).should("not.exist");
  });

  it("RichTextEditor-uncheck Visible field validation", function() {
    // Check the visible checkbox
    cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publishPage.richTextEditorWidget).should("be.visible");
  });

  it("RichTextEditor-check Hide toolbar field validation", function() {
    // Check the Hide toolbar checkbox
    cy.CheckWidgetProperties(commonlocators.hideToolbarCheckbox);
    cy.validateToolbarHidden(
      formWidgetsPage.richTextEditorWidget,
      commonlocators.rteToolbar,
    );
    cy.PublishtheApp();
    cy.validateToolbarHidden(
      publishPage.richTextEditorWidget,
      commonlocators.rteToolbar,
    );
  });

  it("RichTextEditor-uncheck Hide toolbar field validation", function() {
    // Uncheck the Hide toolbar checkbox
    cy.UncheckWidgetProperties(commonlocators.hideToolbarCheckbox);
    cy.validateToolbarVisible(
      formWidgetsPage.richTextEditorWidget,
      commonlocators.rteToolbar,
    );
    cy.PublishtheApp();
    cy.validateToolbarVisible(
      publishPage.richTextEditorWidget,
      commonlocators.rteToolbar,
    );
  });

  it("Reset RichTextEditor", function() {
    cy.setTinyMceContent("rte-6h8j08u7ea", "<h1>content</h1>");

    cy.validateHTMLText(formWidgetsPage.richTextEditorWidget, "h1", "content");
    cy.openPropertyPane("buttonwidget");
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click({ force: true });
    cy.testJsontext("onclick", '{{resetWidget("RichtextEditor")}}');
    cy.get(".t--widget-buttonwidget .bp3-button").click({ force: true });
    cy.wait(500);
    cy.validateHTMLText(
      formWidgetsPage.richTextEditorWidget,
      "h1",
      "This is a Heading",
    );
  });

  describe("Label section", () => {
    it("Check properties: Text, Position, Alignment, Width", () => {
      const widgetName = "richtexteditorwidget";
      const labelText = "Name";
      const parentColumnSpace = 11.625;
      const widgetSelector = `.t--widget-${widgetName}`;
      const labelSelector = `${widgetSelector} label`;
      const containerSelector = `${widgetSelector} [data-testid="rte-container"]`;
      const labelPositionSelector = ".t--property-control-position button";
      const labelAlignmentSelector = ".t--property-control-alignment button";
      const labelWidthSelector =
        ".t--property-control-width .CodeMirror textarea";

      cy.openPropertyPane(widgetName);

      cy.get(".t--property-control-text .CodeMirror textarea")
        .first()
        .focus()
        .type(labelText);
      // Assert label presence
      cy.get(labelSelector)
        .first()
        .contains(labelText);
      // Assert label position: Auto
      cy.get(containerSelector).should("have.css", "flex-direction", "column");
      // Change label position to Top
      cy.get(labelPositionSelector)
        .eq(1)
        .click();
      // Assert label position: Top
      cy.get(containerSelector).should("have.css", "flex-direction", "column");
      // Change label position to Left
      cy.get(labelPositionSelector)
        .eq(2)
        .click();
      cy.wait(300);
      // Set label alignment to RIGHT
      cy.get(labelAlignmentSelector)
        .eq(1)
        .click();
      // Assert label alignment
      cy.get(labelSelector)
        .first()
        .should("have.css", "text-align", "right");
      // Set label width to 4 cols
      cy.get(labelWidthSelector)
        .first()
        .focus()
        .type("4");
      cy.wait(300);
      // Assert label width
      cy.get(labelSelector)
        .first()
        .should("have.css", "width", `${parentColumnSpace * 4}px`);
    });
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
