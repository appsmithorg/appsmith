const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
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
      cy.readTabledataValidateCSS("1", "0", "color", "rgb(219, 234, 254)");
      // Change the text color and enter purple in input field
      cy.get(widgetsPage.textColor)
        .scrollIntoView()
        .clear({ force: true })
        .type("purple", { force: true, delay: 0 });
      cy.wait("@updateLayout");
      // Verify the text color is purple
      cy.readTabledataValidateCSS("1", "0", "color", "rgb(128, 0, 128)");
      // Click on cell background color
      cy.selectColor("cellbackgroundcolor");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // select the green color

      cy.wait("@updateLayout");
      _.agHelper.AssertAutoSave();
      _.deployMode.DeployApp();
      cy.wait(4000);

      // Verify the cell background color is green
      cy.readTabledataValidateCSS(
        "1",
        "1",
        "background-color",
        "rgb(219, 234, 254)",
      );
      _.deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("tablewidget");

      // Change the cell background color and enter purple in input field
      cy.get(
        `${widgetsPage.cellBackground_tablev1} [data-testid='t--color-picker-input']`,
      )
        .clear({ force: true })
        .type("purple", { force: true, delay: 0 });
      cy.wait("@updateLayout");
      _.agHelper.AssertAutoSave();
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
  },
);
