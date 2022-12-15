const publishLocators = require("../../../../../locators/publishWidgetspage.json");
const dslWithServerSide = require("../../../../../fixtures/Listv2/listWithServerSideData.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../../locators/QueryEditor.json");

const simpleListData1 = [
  {
    id: "001",
    name: "Blue",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "002",
    name: "Green",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "003",
    name: "Red",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
];

describe("List widget v2 - Basic server side data tests", () => {
  before(() => {
    cy.addDsl(dslWithServerSide);
    // Open Datasource editor
    cy.wait(2000);
    cy.NavigateToDatasourceEditor();

    // Click on sample(mock) user database.
    cy.get(datasource.mockUserDatabase).click();

    // Choose the first data source which consists of users keyword & Click on the "New Query +"" button
    cy.get(`${datasource.datasourceCard}`)
      .contains("Users")
      .get(`${datasource.createQuery}`)
      .last()
      .click({ force: true });

    // Click the editing field
    cy.get(".t--action-name-edit-field").click({ force: true });

    // Click the editing field
    cy.get(queryLocators.queryNameField).type("Query1");

    // switching off Use Prepared Statement toggle
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });

    //.1: Click on Write query area
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });

    // writing query to get the schema
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(
        "SELECT * FROM users OFFSET {{List1.pageNo * List1.pageSize}} LIMIT {{List1.pageSize}};",
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
    cy.WaitAutoSave();

    cy.runQuery();

    cy.get('.t--entity-name:contains("Page1")').click({ force: true });

    cy.wait(1000);
  });

  it("1. shows correct number of items and binding texts", () => {
    cy.get(publishLocators.containerWidget).should("have.length", 3);
    cy.get(publishLocators.imageWidget).should("have.length", 3);
    cy.get(publishLocators.textWidget).should("have.length", 6);

    cy.get(publishLocators.containerWidget).each(($containerEl) => {
      cy.wrap($containerEl)
        .get(publishLocators.textWidget)
        .eq(1)
        .find("span")
        .invoke("text")
        .should("have.length.gt", 0);
    });
  });

  it("2. next page shows correct number of items and binding text", () => {
    cy.get(".t--list-widget-next-page.rc-pagination-next")
      .find("button")
      .click({ force: true });

    cy.get(".rc-pagination-item").contains(2);

    /**
     * isLoading of the widget does not work properly so for a moment
     * the previous data are visible which can cause the test to pass/fail.
     * Adding a wait makes sure the next page data is loaded.
     */
    cy.wait(3000);

    cy.get(publishLocators.containerWidget).should("have.length", 3);
    cy.get(publishLocators.imageWidget).should("have.length", 3);
    cy.get(publishLocators.textWidget).should("have.length", 6);

    cy.get(publishLocators.containerWidget).each(($containerEl) => {
      cy.wrap($containerEl)
        .get(publishLocators.textWidget)
        .eq(1)
        .find("span")
        .invoke("text")
        .should("have.length.gt", 0);
    });
  });
});
