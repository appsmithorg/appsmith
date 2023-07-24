const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget property pane feature validation", function () {
  before(() => {
    _.agHelper.AddDsl("tableNewDsl");
  });

  it("1. Test to validate text color and text background", function () {
    // Open property pane
    cy.openPropertyPane("tablewidget");
    //cy.moveToStyleTab();
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
    _.deployMode.DeployApp();
    cy.wait(4000);

    // Verify the cell background color is green
    cy.readTabledataValidateCSS(
      "1",
      "1",
      "background-color",
      "rgb(126, 34, 206)",
    );
    _.deployMode.NavigateBacktoEditor();
    cy.openPropertyPane("tablewidget");

    // Change the cell background color and enter purple in input field
    cy.get(`${widgetsPage.cellBackground_tablev1} input`)
      .clear({ force: true })
      .type("purple", { force: true });
    cy.wait("@updateLayout");
    cy.assertPageSave();
    _.deployMode.DeployApp();
    cy.wait(4000);

    // Verify the cell background color is purple
    cy.readTabledataValidateCSS(
      "1",
      "1",
      "background-color",
      "rgb(128, 0, 128)",
    );
  });
});
