const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/tableInputDsl.json");
const pages = require("../../../locators/Pages.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const testdata = require("../../../fixtures/testdata.json");
const dsl2 = require("../../../fixtures/displayWidgetDsl.json");
const explorer = require("../../../locators/explorerlocators.json");
const pageid = "MyPage";

describe("Binding the multiple Widgets and validating NavigateTo Page", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value from table widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.get(widgetsPage.defaultInput).type(testdata.defaultInputWidget);
    cy.get(widgetsPage.actionSelect)
      .first()
      .click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Navigate To")
      .click();
    cy.enterNavigatePageName(pageid);
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.wait(300);
  });

  it("Create MyPage and valdiate if its successfully created", function() {
    cy.Createpage(pageid);
    cy.addDsl(dsl2);
    cy.wait(500);
    cy.get(`.t--entity-name:contains("${pageid}")`).should("be.visible");
  });

  it("Validate NavigateTo Page functionality ", function() {
    cy.SearchEntityandOpen("Table1");
    cy.isSelectRow(1);
    cy.readTabledataPublish("1", "0").then((tabData) => {
      const tabValue = tabData;
      expect(tabValue).to.be.equal("2736212");
      cy.log("the value is" + tabValue);
      cy.get(publish.inputWidget + " " + "input")
        .first()
        .invoke("attr", "value")
        .should("contain", tabValue);
      cy.get(widgetsPage.chartWidget).should("not.exist");

      cy.get(publish.inputGrp)
        .first()
        .type("123");

      cy.get(widgetsPage.chartWidget).should("be.visible");
    });
  });
});
