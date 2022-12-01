/* eslint-disable cypress/no-unnecessary-waiting */

const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableNewDsl.json");
const testdata = require("../../../../../fixtures/testdata.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Test to validate table pagination is disabled", function() {
    // Verify pagination is disabled
    cy.get(".t--table-widget-prev-page").should("have.attr", "disabled");
    cy.get(".t--table-widget-next-page").should("have.attr", "disabled");
    cy.get(".t--table-widget-page-input input").should("have.attr", "disabled");
  });

  it("2. Test to validate text allignment", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
    // Change the text align to center
    cy.get(widgetsPage.centerAlign)
      .first()
      .click({ force: true });
    // Verify the center text alignment
    cy.readTabledataValidateCSS("1", "0", "justify-content", "center");
    // Change the text align to right
    cy.get(widgetsPage.rightAlign)
      .first()
      .click({ force: true });
    // Verify the right text alignment
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-end");
    // Change the text align to left
    cy.get(widgetsPage.leftAlign)
      .first()
      .click({ force: true });
    // verify the left text alignment
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-start");
  });

  it("3. Test to validate column heading allignment", function() {
    // cy.openPropertyPane("tablewidget");
    // Change the text align to center
    cy.get(widgetsPage.centerAlign)
      .first()
      .click({ force: true });
    // Verify the column headings are center aligned
    cy.get(".draggable-header")
      .first()
      .should("have.css", "text-align", "center");
    // Change the text align to right
    cy.get(widgetsPage.rightAlign)
      .first()
      .click({ force: true });
    // Verify the column headings are right aligned
    cy.get(".draggable-header")
      .first()
      .should("have.css", "text-align", "right");
    // Change the text align to left
    cy.get(widgetsPage.leftAlign)
      .first()
      .click({ force: true });
    // Verify the column headings are left aligned
    cy.get(".draggable-header")
      .first()
      .should("have.css", "text-align", "left");
  });

  it("4. Test to validate text format", function() {
    // Select the bold font style
    cy.get(widgetsPage.bold).click({ force: true });
    // Varify the font style is bold
    cy.readTabledataValidateCSS("1", "0", "font-weight", "700");
    // Change the font style to italic
    cy.get(widgetsPage.italics).click({ force: true });
    // Verify the font style is italic
    cy.readTabledataValidateCSS("1", "0", "font-style", "italic");
    // Change the font style to underline
    cy.editColumn("id");
    cy.get(widgetsPage.underline).click({ force: true });
    // Verify the font style is underline
    cy.readTabledataValidateCSS("1", "0", "text-decoration-line", "underline");
  });

  it("5. Test to validate vertical allignment", function() {
    cy.openPropertyPane("tablewidget");
    // Select the top vertical alignment
    cy.get(widgetsPage.verticalTop).click({ force: true });
    // verify vertical alignment is top
    cy.readTabledataValidateCSS("1", "0", "align-items", "flex-start");
    // Change the vertical alignment to center
    cy.get(widgetsPage.verticalCenter)
      .last()
      .click({ force: true });
    // Verify the vertical alignment is centered
    cy.readTabledataValidateCSS("1", "0", "align-items", "center");
    // Change the vertical alignment to bottom
    cy.get(widgetsPage.verticalBottom)
      .last()
      .click({ force: true });
    // Verify the vertical alignment is bottom
    cy.readTabledataValidateCSS("1", "0", "align-items", "flex-end");
  });

  it("6. Table widget toggle test for text alignment", function() {
    // Click on text align JS
    cy.get(widgetsPage.toggleTextAlign)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    // Change the text align value to right for michael and left for others
    cy.toggleJsAndUpdate("tabledata", testdata.bindingGenAlign);
    // Close propert pane

    // Verify the text michael id is right aligned
    cy.readTabledataValidateCSS("0", "0", "justify-content", "flex-end");
    // Verify the 2nd id is left aligned
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-start");
  });

  it("7. Table widget change text size and validate", function() {
    // Verify font size is 14px
    cy.readTabledataValidateCSS("0", "0", "font-size", "14px");

    // Click on text size JS
    cy.get(widgetsPage.toggleTextAlign)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    // Open txe size dropdown options
    cy.get(widgetsPage.textSize)
      .last()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    // Select Heading 1 text size
    cy.selectTxtSize("L");
    // Verify the font size is 24px
    cy.readTabledataValidateCSS("0", "0", "font-size", "20px");
    // close propert pane

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    // Verify the font size is 24px
    cy.readTabledataValidateCSS("0", "0", "font-size", "20px");
  });

  it("8. Test to validate open new tab icon shows when URL type data validate link text ", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");

    // go back to 1st
    cy.get(commonlocators.editPropBackButton).click({ force: true });
    // Open email property pane
    cy.editColumn("email");
    // Change column type to url
    cy.changeColumnType("URL");
    //Check all the occurance
    cy.get(".link-text").should("have.length", "3");
    /*
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=1] .hidden-icon`,
    )
      .should("be.hidden")
      .invoke("show");
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=1] .hidden-icon`,
    ).should("be.visible");
    */
  });

  it("9. Edit column name and test for table header changes", function() {
    cy.get(commonlocators.editPropBackButton).click({ force: true });
    // Open email property pane
    cy.editColumn("email");
    // CHange the Column email name to Email Address
    cy.editColName("Email Address");
    // verify changed email name is visible
    cy.get(".draggable-header:contains('Email Address')").should("be.visible");
    cy.get(commonlocators.editPropBackButton).click({ force: true });
  });

  it("10. Edit Row height and test table for changes", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(widgetsPage.rowHeight)
      .last()
      .click({ force: true });
    cy.get(".t--dropdown-option")
      .contains("Short")
      .click({ force: true });
    cy.wait(2000);
    cy.PublishtheApp();
    cy.readTabledataValidateCSS("0", "1", "height", "19px", true);
    cy.get(publish.backToEditor).click();
    cy.wait(2000);
  });
});
