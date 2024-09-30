import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
import {
  agHelper,
  deployMode,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Text-Table v2 Binding Functionality",
  { tags: ["@tag.Binding"] },
  function () {
    Cypress.on("uncaught:exception", (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false;
    });

    before(() => {
      agHelper.AddDsl("TextTableV2dsl");
    });
    afterEach(() => {
      deployMode.NavigateBacktoEditor();
    });

    it("1. Text-Table Binding Functionality For Id", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
        "Container3",
      ]);
      /**
       * @param(Index)  Provide index value to select the row.
       */
      table.SelectTableRow(1, 0, true, "v2");
      EditorNavigation.SelectEntityByName("Text4", EntityType.Widget, {}, [
        "Container1",
      ]);
      cy.testJsontext("text", "{{Table1.selectedRow.id}}");
      /**
       * @param{Row Index} Provide the row index
       * @param(Column Index) Provide column index
       */
      cy.readTableV2data("1", "0").then((tabData) => {
        const tabValue = tabData;
        cy.get(commonlocators.TextInside).should("have.text", tabValue);
        cy.findAndExpandEvaluatedTypeTitle();
        cy.EvaluateDataType("string");
        cy.validateEvaluatedValue(tabValue);
        deployMode.DeployApp();
        table.SelectTableRow(1, 0, true, "v2");
        cy.readTableV2dataPublish("1", "0").then((tabDataP) => {
          const tabValueP = tabDataP;
          cy.get(commonlocators.TextInside).should("have.text", tabValueP);
        });
      });
    });

    it("2. Text-Table Binding Functionality For Email", function () {
      table.SelectTableRow(2, 0, true, "v2");
      EditorNavigation.SelectEntityByName("Text4", EntityType.Widget, {}, [
        "Container1",
      ]);
      cy.testJsontext("text", "{{Table1.selectedRow.email}}");
      /**
       * @param{Row Index} Provide the row index
       * @param(Column Index) Provide column index
       */
      cy.readTableV2data("2", "1").then((tabData) => {
        const tabValue = tabData;
        cy.get(commonlocators.TextInside).should("have.text", tabValue);
        cy.findAndExpandEvaluatedTypeTitle();
        cy.EvaluateDataType("string");
        cy.validateEvaluatedValue(tabValue);
        deployMode.DeployApp();
        table.SelectTableRow(2, 0, true, "v2");
        cy.readTableV2dataPublish("2", "1").then((tabDataP) => {
          const tabValueP = tabDataP;
          cy.get(commonlocators.TextInside).should("have.text", tabValueP);
        });
      });
    });

    it("3. Text-Table Binding Functionality For Total Length", function () {
      EditorNavigation.SelectEntityByName("Text4", EntityType.Widget, {}, [
        "Container1",
      ]);
      cy.testJsontext("text", "{{Table1.pageSize}}");
      cy.get(commonlocators.TableV2Row)
        .find(".tr")
        .then((listing) => {
          const listingCount = listing.length.toString();
          cy.get(commonlocators.TextInside).contains(listingCount);
          cy.findAndExpandEvaluatedTypeTitle();

          cy.EvaluateDataType("string");
          cy.validateEvaluatedValue(listingCount);
          deployMode.DeployApp();
          cy.get(publish.tableV2Length)
            .find(".tr")
            .then((listing) => {
              const listingCountP = listing.length.toString();
              cy.get(commonlocators.TextInside).contains(listingCountP);
            });
        });
    });

    it("4. Table Widget Functionality To Verify Default Row Selection is working", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
        "Container3",
      ]);
      propPane.ExpandIfCollapsedSection("rowselection");
      cy.testJsontext("defaultselectedrow", "2");
      cy.wait("@updateLayout");
      cy.get(commonlocators.TableV2Row)
        .find(".tr.selected-row")
        .then((listing) => {
          const listingCount = listing.length;
          expect(listingCount).to.be.equal(1);
        });
      EditorNavigation.SelectEntityByName("Text4", EntityType.Widget, {}, [
        "Container1",
      ]);
      cy.testJsontext("text", "{{Table1.selectedRow.email}}");
      deployMode.DeployApp();
      cy.readTableV2dataPublish("2", "1").then((tabDataP) => {
        const tabValueP = tabDataP;
        cy.get(commonlocators.TextInside).should("have.text", tabValueP);
      });
    });

    it("5. Text-Table Binding Functionality For Username", function () {
      /**
       * @param(Index)  Provide index value to select the row.
       */
      table.SelectTableRow(1, 0, true, "v2");
      EditorNavigation.SelectEntityByName("Text4", EntityType.Widget, {}, [
        "Container1",
      ]);
      propPane.UpdatePropertyFieldValue(
        "Text",
        JSON.stringify(this.dataSet.textfun),
      );
      /**
       * @param{Row Index} Provide the row index
       * @param(Column Index) Provide column index
       */
      cy.readTableV2data("1", "2").then((tabData) => {
        const tabValue = `\"${tabData}\"`;
        cy.get(commonlocators.TextInside).contains(tabValue);
        cy.findAndExpandEvaluatedTypeTitle();
        cy.EvaluateDataType("string");
        cy.validateEvaluatedValue(tabValue);
        deployMode.DeployApp();
        table.SelectTableRow(1, 0, true, "v2");
        cy.readTableV2dataPublish("1", "2").then((tabDataP) => {
          const tabValueP = `\"${tabDataP}\"`;
          cy.get(commonlocators.TextInside).contains(tabValueP);
        });
      });
    });
  },
);
