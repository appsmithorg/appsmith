const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/TextTabledsl.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Text-Table Binding Functionality", function () {
  Cypress.on("uncaught:exception", (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false;
  });

  before(() => {
    cy.addDsl(dsl);
  });
  it("1. Text-Table Binding Functionality For Id", function () {
    cy.openPropertyPane("tablewidget");
    /**
     * @param(Index)  Provide index value to select the row.
     */
    cy.isSelectRow(1);
    cy.openPropertyPane("textwidget");
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
      _.deployMode.DeployApp();
      cy.isSelectRow(1);
      cy.readTabledataPublish("1", "0").then((tabDataP) => {
        const tabValueP = tabDataP;
        cy.get(commonlocators.TextInside).should("have.text", tabValueP);
      });
    });
  });

  it("2. Text-Table Binding Functionality For Email", function () {
    cy.isSelectRow(2);
    cy.openPropertyPane("textwidget");
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
      _.deployMode.DeployApp();
      cy.isSelectRow(2);
      cy.readTabledataPublish("2", "1").then((tabDataP) => {
        const tabValueP = tabDataP;
        cy.get(commonlocators.TextInside).should("have.text", tabValueP);
      });
    });
  });
  it("3. Text-Table Binding Functionality For Total Length", function () {
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.pageSize}}");
    cy.get(commonlocators.TableRow)
      .find(".tr")
      .then((listing) => {
        const listingCount = listing.length.toString();
        cy.get(commonlocators.TextInside).contains(listingCount);
        cy.findAndExpandEvaluatedTypeTitle();
        cy.EvaluateDataType("string");
        cy.validateEvaluatedValue(listingCount);
        _.deployMode.DeployApp();
        cy.get(publish.tableLength)
          .find(".tr")
          .then((listing) => {
            const listingCountP = listing.length.toString();
            cy.get(commonlocators.TextInside).contains(listingCountP);
          });
      });
  });

  it("4. Table Widget Functionality To Verify Default Row Selection is working", function () {
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("defaultselectedrow", "2");
    cy.wait("@updateLayout");
    cy.get(commonlocators.TableRow)
      .find(".tr.selected-row")
      .then((listing) => {
        const listingCount = listing.length;
        expect(listingCount).to.be.equal(1);
      });
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.selectedRow.email}}");
    _.deployMode.DeployApp();
    cy.readTabledataPublish("2", "1").then((tabDataP) => {
      const tabValueP = tabDataP;
      cy.get(commonlocators.TextInside).should("have.text", tabValueP);
    });
  });

  it("5. Text-Table Binding Functionality For Username", function () {
    /**
     * @param(Index)  Provide index value to select the row.
     */
    cy.isSelectRow(1);
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", JSON.stringify(this.dataSet.textfun));
    /**
     * @param{Row Index} Provide the row index
     * @param(Column Index) Provide column index
     */
    cy.readTabledata("1", "2").then((tabData) => {
      const tabValue = `\"${tabData}\"`;
      cy.get(commonlocators.TextInside).contains(tabValue);
      cy.findAndExpandEvaluatedTypeTitle();
      cy.EvaluateDataType("string");
      cy.validateEvaluatedValue(tabValue);
      _.deployMode.DeployApp();
      cy.isSelectRow(1);
      cy.readTabledataPublish("1", "2").then((tabDataP) => {
        const tabValueP = `\"${tabDataP}\"`;
        cy.get(commonlocators.TextInside).contains(tabValueP);
      });
    });
  });
});
afterEach(() => {
  _.deployMode.NavigateBacktoEditor();
});
