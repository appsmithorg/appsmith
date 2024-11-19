const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 property pane feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    beforeEach(() => {
      _.agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      _.agHelper.SaveLocalStorageCache();
    });

    beforeEach(() => {
      _.agHelper.AddDsl("tableV2NewDsl");
    });

    it("1. Test to validate text color and text background", function () {
      // Open property pane
      cy.openPropertyPane("tablewidgetv2");
      cy.moveToStyleTab();
      // Click on text color input field
      cy.selectColor("textcolor");
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      cy.wait("@updateLayout");
      // Verify the text color is green
      cy.readTableV2dataValidateCSS("1", "0", "color", "rgb(219, 234, 254)");
      // Change the text color and enter purple in input field
      cy.get(widgetsPage.textColor)
        .scrollIntoView()
        .clear({ force: true })
        .type("purple", { force: true, delay: 0 });
      cy.wait("@updateLayout");
      // Verify the text color is purple
      cy.readTableV2dataValidateCSS("1", "0", "color", "rgb(128, 0, 128)");
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
      cy.readTableV2dataValidateCSS(
        "1",
        "1",
        "background-color",
        "rgb(219, 234, 254)",
      );
      _.deployMode.NavigateBacktoEditor();
      cy.openPropertyPane("tablewidgetv2");
      cy.moveToStyleTab();
      // Change the cell background color and enter purple in input field
      cy.get(
        `.t--property-control-cellbackgroundcolor [data-testid='t--color-picker-input']`,
      )
        .clear({ force: true })
        .type("purple", { force: true, delay: 0 });
      cy.wait("@updateLayout");
      //cy.assertPageSave();
      _.deployMode.DeployApp();
      cy.wait(4000);

      // Verify the cell background color is purple
      cy.readTableV2dataValidateCSS(
        "1",
        "1",
        "background-color",
        "rgb(128, 0, 128)",
      );
      _.deployMode.NavigateBacktoEditor();
    });

    it("2. check background of the edit action column", function () {
      cy.openPropertyPane("tablewidgetv2");
      _.table.toggleColumnEditableViaColSettingsPane("id", "v2", true, true);
      cy.readTableV2dataValidateCSS(
        0,
        5,
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
      cy.moveToStyleTab();
      cy.get(".t--property-control-cellbackgroundcolor")
        .find(".t--js-toggle")
        .click();
      _.propPane.UpdatePropertyFieldValue(
        "Cell background color",
        "rgb(255, 0, 0)",
      );
      cy.readTableV2dataValidateCSS(0, 5, "background-color", "rgb(255, 0, 0)");
    });
  },
);
