const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableV2WidgetDsl.json");
const testdata = require("../../../../fixtures/testdata.json");
const dsl2 = require("../../../../fixtures/displayWidgetDsl.json");
const pageid = "MyPage";

import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Table Widget V2 and Navigate to functionality validation", function () {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  before(() => {
    cy.addDsl(dsl);
    cy.wait(2000); //dsl to settle!
  });

  it("1. Create MyPage and validate if its successfully created", function () {
    cy.Createpage(pageid);
    cy.addDsl(dsl2);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
  });

  it("2. Table Widget V2 Functionality with multiple page", function () {
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.openPropertyPane("tablewidgetv2");
    cy.widgetText(
      "Table1",
      widgetsPage.tableWidgetV2,
      widgetsPage.widgetNameSpan,
    );
    cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
    cy.focused().blur();
    cy.get(widgetsPage.tableOnRowSelect).scrollIntoView().should("be.visible");
    cy.get(widgetsPage.tableOnRowSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Navigate to")
      .click();
    cy.get(".t--open-dropdown-Select-Page").click();
    cy.get(commonlocators.singleSelectMenuItem)
      .contains(pageid)
      .click({ force: true });
    cy.assertPageSave();
  });

  it("3. Validate NavigateTo Page functionality ", function () {
    cy.wait(2000);
    cy.PublishtheApp();
    cy.get(widgetsPage.chartWidget).should("not.exist");
    cy.isSelectRow(1);
    cy.get(widgetsPage.chartWidget).should("be.visible");
  });
});
