const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableV2WidgetDsl.json");
const testdata = require("../../../../fixtures/testdata.json");
const dsl2 = require("../../../../fixtures/displayWidgetDsl.json");
const pageid = "MyPage";

describe("Table Widget V2 and Navigate to functionality validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Table Widget V2 Functionality with multiple page", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.widgetText(
      "Table1",
      widgetsPage.tableWidgetV2,
      commonlocators.tableV2Inner,
    );
    cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
    cy.get(widgetsPage.tableOnRowSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Navigate to")
      .click();
    cy.enterNavigatePageName(pageid);
    cy.assertPageSave();
  });

  it("2. Create MyPage and valdiate if its successfully created", function() {
    cy.Createpage(pageid);
    cy.addDsl(dsl2);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.CheckAndUnfoldEntityItem("PAGES");
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
  });

  it("3. Validate NavigateTo Page functionality ", function() {
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.wait(2000);
    cy.PublishtheApp();
    cy.get(widgetsPage.chartWidget).should("not.exist");
    cy.isSelectRow(1);
    cy.get(widgetsPage.chartWidget).should("be.visible");
  });
});
