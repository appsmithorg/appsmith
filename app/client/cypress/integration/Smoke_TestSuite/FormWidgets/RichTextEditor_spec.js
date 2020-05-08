const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl1.json");
const homePage = require("../../../locators/HomePage.json");

describe("RichTextEditor Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("RichTextEditor Widget Functionality", function() {
    cy.get(formWidgetsPage.richTextEditorWidget)
      .first()
      .trigger("mouseover");
    cy.get(formWidgetsPage.richTextEditorWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });

    //changing the Text Name
    cy.widgetText(
      this.data.RichTextEditorName,
      formWidgetsPage.richTextEditorWidget,
      formWidgetsPage.richTextEditorWidget + " pre",
    );

    //Edit the text area with Html
    cy.testCodeMirror(this.data.HtmlText);

    //Validating Html
    cy.get(formWidgetsPage.richTextEditorWidget + " iframe").then($iframe => {
      const $body = $iframe.contents().find("body");
      cy.wrap($body)
        .find("h1")
        .should("have.text", "This is a Heading");
    });

    cy.get(commonlocators.editPropCrossButton).click();

    cy.get(formWidgetsPage.richTextEditorWidget)
      .children(commonlocators.editicon)
      .first()
      .click({ force: true });

    //Edit the text area with Plain text
    cy.testCodeMirror(this.data.RichTexteditorBody);

    //Validating Plain text
    cy.get(formWidgetsPage.richTextEditorWidget + " iframe").then($iframe => {
      const $body = $iframe.contents().find("body");
      cy.wrap($body)
        .find("p")
        .should("have.text", this.data.RichTexteditorBody);
    });

    //Check the Disabled checkbox
    cy.CheckWidgetProperties(
      ".t--property-control-disable input[type='checkbox']",
    );
    cy.get(
      formWidgetsPage.richTextEditorWidget + " button[disabled='disabled']",
    ).should("exist");

    //UnCheck the Disabled checkbox
    cy.UnCheckWidgetProperties(
      ".t--property-control-disable input[type='checkbox']",
    );
    cy.get(
      formWidgetsPage.richTextEditorWidget + " button[disabled='disabled']",
    ).should("not.exist");

    cy.get(commonlocators.editPropCrossButton).click();
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
