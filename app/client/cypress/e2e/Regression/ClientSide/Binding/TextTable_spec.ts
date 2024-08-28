import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
import {
  entityExplorer,
  agHelper,
  deployMode,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Text-Table Binding Functionality",
  { tags: ["@tag.Binding"] },
  function () {
    Cypress.on("uncaught:exception", (err, runnable) => {
      // returning false here prevents Cypress from
      // failing the test
      return false;
    });

    before(() => {
      agHelper.AddDsl("TextTabledsl");
    });
    it("1. Text-Table Binding Functionality For Id", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
        "Container3",
      ]);
      /**
       * @param(Index)  Provide index value to select the row.
       */
      table.SelectTableRow(1);
      EditorNavigation.SelectEntityByName("Text4", EntityType.Widget, {}, [
        "Container1",
      ]);
      cy.testJsontext("text", "{{Table1.selectedRow.id}}");
      /**
       * @param{Row Index} Provide the row index
       * @param(Column Index) Provide column index
       */
      cy.readTabledata("1", "0").then((tabData) => {
        const tabValue = tabData;
        cy.get(commonlocators.TextInside).should("have.text", tabValue);
        cy.findAndExpandEvaluatedTypeTitle();
        cy.EvaluateDataType("string");
        cy.validateEvaluatedValue(tabValue);
        deployMode.DeployApp();
        table.SelectTableRow(1);
        cy.readTabledataPublish("1", "0").then((tabDataP) => {
          const tabValueP = tabDataP;
          cy.get(commonlocators.TextInside).should("have.text", tabValueP);
        });
      });
      deployMode.NavigateBacktoEditor();
    });

    it("2. Text-Table Binding Functionality For Email", function () {
      table.SelectTableRow(2);
      EditorNavigation.SelectEntityByName("Text4", EntityType.Widget, {}, [
        "Container1",
      ]);
      cy.testJsontext("text", "{{Table1.selectedRow.email}}");
      /**
       * @param{Row Index} Provide the row index
       * @param(Column Index) Provide column index
       */
      cy.readTabledata("2", "1").then((tabData) => {
        const tabValue = tabData;
        cy.get(commonlocators.TextInside).should("have.text", tabValue);
        cy.findAndExpandEvaluatedTypeTitle();
        cy.EvaluateDataType("string");
        cy.validateEvaluatedValue(tabValue);
        deployMode.DeployApp();
        table.SelectTableRow(2);
        cy.readTabledataPublish("2", "1").then((tabDataP) => {
          const tabValueP = tabDataP;
          cy.get(commonlocators.TextInside).should("have.text", tabValueP);
        });
      });
      deployMode.NavigateBacktoEditor();
    });

    it("3. Text-Table Binding Functionality For Total Length", function () {
      EditorNavigation.SelectEntityByName("Text4", EntityType.Widget, {}, [
        "Container1",
      ]);
      cy.testJsontext("text", "{{Table1.pageSize}}");
      cy.get(commonlocators.TableRow)
        .find(".tr")
        .then((listing) => {
          const listingCount = listing.length.toString();
          cy.get(commonlocators.TextInside).contains(listingCount);
          cy.findAndExpandEvaluatedTypeTitle();
          cy.EvaluateDataType("string");
          cy.validateEvaluatedValue(listingCount);
          deployMode.DeployApp();
          cy.get(publish.tableLength)
            .find(".tr")
            .then((listing) => {
              const listingCountP = listing.length.toString();
              cy.get(commonlocators.TextInside).contains(listingCountP);
            });
        });
      deployMode.NavigateBacktoEditor();
    });

    it("4. Table Widget Functionality To Verify Default Row Selection is working", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget, {}, [
        "Container3",
      ]);
      cy.testJsontext("defaultselectedrow", "2");
      cy.wait("@updateLayout");
      cy.get(commonlocators.TableRow)
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
      cy.readTabledataPublish("2", "1").then((tabDataP) => {
        const tabValueP = tabDataP;
        cy.get(commonlocators.TextInside).should("have.text", tabValueP);
      });
      deployMode.NavigateBacktoEditor();
    });

    it("5. Text-Table Binding Functionality For Username", function () {
      /**
       * @param(Index)  Provide index value to select the row.
       */
      table.SelectTableRow(1);
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
      cy.readTabledata("1", "2").then((tabData) => {
        const tabValue = `\"${tabData}\"`;
        cy.get(commonlocators.TextInside).contains(tabValue);
        //entityExplorer.SelectEntityByName("Text4");
        cy.findAndExpandEvaluatedTypeTitle();
        cy.EvaluateDataType("string");
        cy.validateEvaluatedValue(tabValue);
        deployMode.DeployApp();
        table.SelectTableRow(1);
        cy.readTabledataPublish("1", "2").then((tabDataP) => {
          const tabValueP = `\"${tabDataP}\"`;
          cy.get(commonlocators.TextInside).contains(tabValueP);
        });
      });
    });
    afterEach(() => {
      // deployMode.NavigateBacktoEditor();
    });
  },
);
