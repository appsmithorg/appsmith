const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/TextTableV2dsl.json");

describe("Text-Table v2 Binding Functionality", function() {
  Cypress.on("uncaught:exception", (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false;
  });

  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Text-Table Binding Functionality For Id", function() {
    cy.openPropertyPane("tablewidgetv2");
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
    cy.readTableV2data("1", "0").then((tabData) => {
      const tabValue = tabData;
      cy.get(commonlocators.TextInside).should("have.text", tabValue);
      cy.get(commonlocators.evaluatedTypeTitle)
        .first()
        .find("span")
        .click();
      cy.EvaluateDataType("string");
      cy.validateEvaluatedValue(tabValue);
      cy.PublishtheApp();
      cy.isSelectRow(1);
      cy.readTableV2dataPublish("1", "0").then((tabDataP) => {
        const tabValueP = tabDataP;
        cy.get(commonlocators.TextInside).should("have.text", tabValueP);
      });
    });
  });

  it("2. Text-Table Binding Functionality For Email", function() {
    cy.get(publish.backToEditor).click();
    cy.isSelectRow(2);
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.selectedRow.email}}");
    /**
     * @param{Row Index} Provide the row index
     * @param(Column Index) Provide column index
     */
    cy.readTableV2data("2", "1").then((tabData) => {
      const tabValue = tabData;
      cy.get(commonlocators.TextInside).should("have.text", tabValue);
      cy.get(commonlocators.evaluatedTypeTitle)
        .first()
        .find("span")
        .click();
      cy.EvaluateDataType("string");
      cy.validateEvaluatedValue(tabValue);
      cy.PublishtheApp();
      cy.isSelectRow(2);
      cy.readTableV2dataPublish("2", "1").then((tabDataP) => {
        const tabValueP = tabDataP;
        cy.get(commonlocators.TextInside).should("have.text", tabValueP);
      });
    });
  });

  it("3. Text-Table Binding Functionality For Total Length", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.pageSize}}");
    cy.get(commonlocators.TableV2Row)
      .find(".tr")
      .then((listing) => {
        const listingCount = listing.length.toString();
        cy.get(commonlocators.TextInside).contains(listingCount);
        cy.get(commonlocators.evaluatedTypeTitle)
          .first()
          .find("span")
          .click();
        cy.EvaluateDataType("string");
        cy.validateEvaluatedValue(listingCount);
        cy.PublishtheApp();
        cy.get(publish.tableV2Length)
          .find(".tr")
          .then((listing) => {
            const listingCountP = listing.length.toString();
            cy.get(commonlocators.TextInside).contains(listingCountP);
          });
      });
  });

  it("4. Table Widget Functionality To Verify Default Row Selection is working", function() {
    cy.get(publish.backToEditor).click();
    cy.openPropertyPane("tablewidgetv2");
    cy.testJsontext("defaultselectedrow", "2");
    cy.wait("@updateLayout");
    cy.get(commonlocators.TableV2Row)
      .find(".tr.selected-row")
      .then((listing) => {
        const listingCount = listing.length;
        expect(listingCount).to.be.equal(1);
      });
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{Table1.selectedRow.email}}");
    cy.PublishtheApp();
    cy.readTableV2dataPublish("2", "1").then((tabDataP) => {
      const tabValueP = tabDataP;
      cy.get(commonlocators.TextInside).should("have.text", tabValueP);
    });
  });

  it("5. Text-Table Binding Functionality For Username", function() {
    cy.get(publish.backToEditor).click();
    /**
     * @param(Index)  Provide index value to select the row.
     */
    cy.isSelectRow(1);
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", JSON.stringify(this.data.textfun));
    /**
     * @param{Row Index} Provide the row index
     * @param(Column Index) Provide column index
     */
    cy.readTableV2data("1", "2").then((tabData) => {
      const tabValue = `\"${tabData}\"`;
      cy.get(commonlocators.TextInside).contains(tabValue);
      cy.get(commonlocators.evaluatedTypeTitle)
        .first()
        .find("span")
        .click();
      cy.EvaluateDataType("string");
      cy.validateEvaluatedValue(tabValue);
      cy.PublishtheApp();
      cy.isSelectRow(1);
      cy.readTableV2dataPublish("1", "2").then((tabDataP) => {
        const tabValueP = `\"${tabDataP}\"`;
        cy.get(commonlocators.TextInside).contains(tabValueP);
      });
    });
  });
});
