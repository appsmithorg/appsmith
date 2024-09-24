import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import * as _ from "../../../../../support/Objects/ObjectsCore";
const testdata = require("../../../../../fixtures/testdata.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import PageList from "../../../../../support/Pages/PageList";

const demoTableData = `
{{
  [
    {
      role: 1,
      id: 1,
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      age: 28,
      gender: 2
    },
    {
      role: 2,
      id: 2,
      name: "Bob Smith",
      email: "bob.smith@example.com",
      age: 34,
      gender: 1
    },
    {
      role: 3,
      id: 3,
      name: "Charlie Brown",
      email: "charlie.brown@example.com",
      age: 25,
      gender: 3
    },
    {
      role: 2,
      id: 4,
      name: "Diana Prince",
      email: "diana.prince@example.com",
      age: 30,
      gender: 2
    },
    {
      role: 1,
      id: 5,
      name: "Evan Williams",
      email: "evan.williams@example.com",
      age: 27,
      gender: 1
    }
  ]
}}
  `;

describe(
  "Table Widget V2 Sorting",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    beforeEach(() => {
      PageList.AddNewPage();
    });

    it("1. Verifies that table sorting works for a custom column with computed value even when it is renamed", function () {
      _.agHelper.AddDsl("tableV2NewDslWithPagination");
      cy.openPropertyPane("tablewidgetv2");
      cy.addColumnV2("customColumn1");
      cy.editColumn("customColumn1");
      cy.updateComputedValueV2(testdata.currentIndex);
      cy.backFromPropertyPanel();

      // Ensure simple sorting for a custom column in working
      // customColumn1 is at index 5 in the table
      cy.sortColumn("customColumn1", "ascending");
      cy.readTableV2data(0, 5).then((data) => {
        expect(data).to.eq("0");
      });
      cy.readTableV2data(1, 5).then((data) => {
        expect(data).to.eq("1");
      });

      cy.sortColumn("customColumn1", "descending");
      cy.readTableV2data(0, 5).then((data) => {
        expect(data).to.eq("9");
      });
      cy.readTableV2data(1, 5).then((data) => {
        expect(data).to.eq("8");
      });

      // Rename customColumn1 to customColumn2
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("customColumn1");
      cy.get(_.propPane._paneTitle).click({ force: true });
      cy.get(_.propPane._paneTitle)
        .type("customColumn2", { delay: 300 })
        .type("{enter}");

      // Ensure that renaming preserves existing data in the table
      cy.readTableV2data(0, 5).then((data) => {
        expect(data).to.eq("9");
      });

      // Ensure ascending/descending sorting works in the table with the renamed column
      cy.sortColumn("customColumn2", "ascending");
      cy.readTableV2data(0, 5).then((data) => {
        expect(data).to.eq("0");
      });
      cy.readTableV2data(1, 5).then((data) => {
        expect(data).to.eq("1");
      });

      cy.sortColumn("customColumn2", "descending");
      cy.readTableV2data(0, 5).then((data) => {
        expect(data).to.eq("9");
      });
      cy.readTableV2data(1, 5).then((data) => {
        expect(data).to.eq("8");
      });
    });

    it("2. Verifies that default sorting works for a select column using the value property", function () {
      // This flag is turned on to allow the label show in the table select cell content
      // when this feature is turned on fully, this flag will be removed
      featureFlagIntercept({ release_table_cell_label_value_enabled: true });
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 350, y: 500 });
      _.propPane.EnterJSContext("Table data", demoTableData);

      // edit role column to select type
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("role");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(_.locators._dropdownText).children().contains("Select").click();
      cy.wait("@updateLayout");

      // add dummy select data to the column
      cy.get(_.locators._controlOption).should("exist");
      cy.updateCodeInput(
        _.locators._controlOption,
        `
      {{
        [
          {"label": "Software Engineer",
          "value": 1,},
          {"label": "Product Manager",
          "value": 2,},
          {"label": "UX Designer",
          "value": 3,}
        ]  
      }}
    `,
      );
      cy.backFromPropertyPanel();

      // sort the column in ascending order
      cy.sortColumn("role", "ascending");
      cy.readTableV2data(0, 0).then((data) => {
        expect(data).to.eq("Software Engineer");
      });
      cy.readTableV2data(1, 0).then((data) => {
        expect(data).to.eq("Software Engineer");
      });
      cy.readTableV2data(2, 0).then((data) => {
        expect(data).to.eq("Product Manager");
      });
      cy.readTableV2data(3, 0).then((data) => {
        expect(data).to.eq("Product Manager");
      });
      cy.readTableV2data(4, 0).then((data) => {
        expect(data).to.eq("UX Designer");
      });
    });

    it("3. Verifies that sorting works for the select column type when sortBy is set to label", function () {
      // This flag is turned on to allow the label show in the table select cell content
      // when this feature is turned on fully, this flag will be removed
      featureFlagIntercept({ release_table_cell_label_value_enabled: true });
      cy.dragAndDropToCanvas("tablewidgetv2", { x: 350, y: 500 });
      _.propPane.EnterJSContext("Table data", demoTableData);

      // edit role column to select type
      cy.openPropertyPane("tablewidgetv2");
      cy.editColumn("role");
      cy.get(commonlocators.changeColType).last().click();
      cy.get(_.locators._dropdownText).children().contains("Select").click();

      // change sortBy to label
      cy.get(commonlocators.changeSortBy).last().click();
      cy.get(_.locators._dropdownText).children().contains("Label").click();
      cy.wait("@updateLayout");

      // add dummy select data to the column
      cy.get(_.locators._controlOption).should("exist");
      cy.updateCodeInput(
        _.locators._controlOption,
        `
      {{
        [
          {"label": "Software Engineer",
          "value": 1,},
          {"label": "Product Manager",
          "value": 2,},
          {"label": "UX Designer",
          "value": 3,}
        ]  
      }}
    `,
      );
      cy.backFromPropertyPanel();

      // sort the column in ascending order
      cy.sortColumn("role", "ascending");
      cy.readTableV2data(0, 0).then((data) => {
        expect(data).to.eq("Product Manager");
      });
      cy.readTableV2data(1, 0).then((data) => {
        expect(data).to.eq("Product Manager");
      });
      cy.readTableV2data(2, 0).then((data) => {
        expect(data).to.eq("Software Engineer");
      });
      cy.readTableV2data(3, 0).then((data) => {
        expect(data).to.eq("Software Engineer");
      });
      cy.readTableV2data(4, 0).then((data) => {
        expect(data).to.eq("UX Designer");
      });
    });
  },
);
