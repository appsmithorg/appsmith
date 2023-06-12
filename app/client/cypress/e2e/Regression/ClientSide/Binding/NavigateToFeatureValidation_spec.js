const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");
const pageid = "MyPage";
import {
  entityExplorer,
  agHelper,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe("Table Widget with Input Widget and Navigate to functionality validation", function () {
  before(() => {
    cy.fixture("navigateTotabledsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Table Widget Functionality with multiple page", function () {
    entityExplorer.SelectEntityByName("Table1");
    cy.widgetText(
      "Table1",
      widgetsPage.tableWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.testJsontext("tabledata", JSON.stringify(testdata.TablePagination));
    //Create MyPage and valdiate if its successfully created
    cy.Createpage(pageid);
    cy.fixture("navigateToInputDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.CheckAndUnfoldEntityItem("Pages");
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
  });

  it("2. Validate NavigateTo Page functionality ", function () {
    cy.get(`.t--entity-name:contains("Page1")`)
      .should("be.visible")
      .click({ force: true });
    cy.wait(4000);
    deployMode.DeployApp();
    cy.readTabledataPublish("1", "0").then((tabDataP) => {
      const tabValueP = tabDataP;
      cy.log(tabValueP);
      cy.isSelectRow(1);
      cy.get("input").should("be.visible");
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValueP);
    });
  });
});
