const commonlocators = require("../../../../../locators/commonlocators.json");
const Layoutpage = require("../../../../../locators/Layout.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "File Picker Widget V2 Functionality",
  { tags: ["@tag.All", "@tag.Filepicker", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("filePickerV2_reset_check_dsl");
    });

    it("Check if the uploaded data does not reset when tab switch in the TabsWidget", () => {
      cy.get(widgetsPage.filepickerwidgetv2).should("contain", "Select Files");
      cy.get(widgetsPage.filepickerwidgetv2).click();
      cy.get(commonlocators.filePickerInput)
        .first()
        .selectFile("cypress/fixtures/testFile.mov", {
          force: true,
        });
      cy.get(commonlocators.filePickerUploadButton).click();
      cy.get(widgetsPage.filepickerwidgetv2).should(
        "contain",
        "1 files selected",
      );
      cy.get(Layoutpage.tabWidget).contains("Tab 2").click({ force: true });
      cy.get(Layoutpage.tabWidget)
        .contains("Tab 2")
        .should("have.class", "is-selected");
      cy.get(Layoutpage.tabWidget).contains("Tab 1").click({ force: true });
      cy.get(Layoutpage.tabWidget)
        .contains("Tab 1")
        .should("have.class", "is-selected");
      cy.get(widgetsPage.filepickerwidgetv2).should(
        "contain",
        "1 files selected",
      );
    });
  },
);
