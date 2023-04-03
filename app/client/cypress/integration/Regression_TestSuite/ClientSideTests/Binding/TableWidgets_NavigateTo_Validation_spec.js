const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
const dsl = require("../../../../fixtures/tableWidgetDsl.json");
const dsl2 = require("../../../../fixtures/displayWidgetDsl.json");
const pageid = "MyPage";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Table Widget and Navigate to functionality validation", function () {
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

  it("Create MyPage and valdiate if its successfully created", function () {
    cy.Createpage(pageid);
    cy.addDsl(dsl2);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
  });

  it("Table Widget Functionality with multiple page", function () {
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.openPropertyPane("tablewidget");
    cy.widgetText(
      "Table1",
      widgetsPage.tableWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
    cy.focused().blur();
    cy.get(widgetsPage.tableOnRowSelect).scrollIntoView().click();
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

  it("Validate NavigateTo Page functionality ", function () {
    cy.wait(2000);
    cy.PublishtheApp();
    cy.get(widgetsPage.chartWidget).should("not.exist");
    cy.isSelectRow(1);
    cy.get(widgetsPage.chartWidget).should("be.visible");
  });
});
