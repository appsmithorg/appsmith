// <reference types="Cypress" />

import {
    agHelper,
    deployMode,
    entityExplorer,
    table,
    locators,
} from "../../../../support/Objects/ObjectsCore";

describe("JS Object Table Testing", { tags: ["@tag.JS"] }, () => {
    before(() => {
        // Navigate to the test application
        cy.visit(
            "https://release-ee-mongo.appsmith.com/app/js-object-testing-upto-1-5-mb/page1-674006a10baa2541d71076a1",
        );
        
    });

    it("1. Verify table is loaded and contains data", () => {
        // Wait for table to load and Verify table exists and is visible
       table.WaitUntilTableLoad(0, 0, "v2");
       agHelper.GetNClick(locators._tableWidget, 0, true);
       agHelper.AssertElementVisibility(locators._tableWidget);
       agHelper.AssertContains("1145725528");

      // Verify first row data and verify table headers exist
      table.ReadTableRowColumnData(0, 0, "v2").then((cellData) => {
        expect(cellData).to.not.be.empty;
        });
      table.AssertTableLoaded;
      table.AssertTableHeaderOrder;

      // Check if pagination exists
      agHelper.GetElement("body").then(($body) => {
        if ($body.find(table._listNextPage).length > 0) {
            // Verify next page functionality
            table.NavigateToNextPage();
            // Wait for table to load
            table.WaitUntilTableLoad();
            // Verify data loads in next page
            table.ReadTableRowColumnData(0, 0, "v2").then((cellData) => {
            expect(cellData).to.not.be.empty;
            });
        }
      });
    });

});