const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/tableNewDsl.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Test to validate text color and text background", function() {
    // Open property pane
    cy.openPropertyPane("tablewidget");
    // Click on text color input field
    cy.selectColor("textcolor");

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.wait("@updateLayout");
    // Verify the text color is green
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(126, 34, 206)");
    // Change the text color and enter purple in input field
    cy.get(widgetsPage.textColor)
      .scrollIntoView()
      .clear({ force: true })
      .type("purple", { force: true });
    cy.wait("@updateLayout");
    // Verify the text color is purple
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(128, 0, 128)");
    // Click on cell background color
    cy.selectColor("cellbackgroundcolor");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    // select the green color

    cy.wait("@updateLayout");
    cy.assertPageSave();
    cy.PublishtheApp();
    cy.wait(4000);

    // Verify the cell background color is green
    cy.readTabledataValidateCSS(
      "1",
      "1",
      "background-color",
      "rgb(126, 34, 206)",
    );
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("tablewidget");

    // Change the cell background color and enter purple in input field
    cy.get(`${widgetsPage.cellBackground} input`)
      .clear({ force: true })
      .type("purple", { force: true });
    cy.wait("@updateLayout");
    cy.assertPageSave();
    cy.PublishtheApp();
    cy.wait(4000);

    // Verify the cell background color is purple
    cy.readTabledataValidateCSS(
      "1",
      "1",
      "background-color",
      "rgb(128, 0, 128)",
    );
    cy.get(publish.backToEditor).click();
  });
});
