const dsl = require("../../../../../fixtures/listv2PaginationDsl.json");
const dslWithServerSide = require("../../../../../fixtures/Listv2/listWithServerSideData.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../../locators/QueryEditor.json");

import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const listData = [
  {
    id: 10,
    name: "okbuddy",
  },
  {
    id: 11,
    name: "Aliess",
  },
  {
    id: 14,
    name: "Aliess123",
  },
  {
    id: 15,
    name: "Aliess",
  },
  {
    id: 16,
    name: "Aliess",
  },
  {
    id: 17,
    name: "Aliess",
  },
  {
    id: 18,
    name: "Aliess",
  },
  {
    id: 19,
    name: "Aliess",
  },
  {
    id: 20,
    name: "Jennie James",
  },
  {
    id: 21,
    name: "Aliess",
  },
  {
    id: 22,
    name: "Aliess",
  },
  {
    id: 23,
    name: "Aliess",
  },
  {
    id: 24,
    name: "Aliess",
  },
  {
    id: 25,
    name: "Aliess",
  },
  {
    id: 26,
    name: "Aliess",
  },
  {
    id: 27,
    name: "Aliess",
  },
  {
    id: 28,
    name: "Aliess",
  },
  {
    id: 29,
    name: "Aliess",
  },
  {
    id: 30,
    name: "Aliess",
  },
];

let agHelper = ObjectsRegistry.AggregateHelper;

describe("List widget V2 page number and page size", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. List widget V2 with client side pagination", () => {
    cy.openPropertyPane("listwidgetv2");
    cy.testJsontext("items", JSON.stringify(listData));
    cy.wait("@updateLayout");
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", `PageSize {{List1.pageSize}}`);
    cy.wait("@updateLayout");

    cy.get(commonlocators.bodyTextStyle)
      .first()
      .should("have.text", "PageSize 4");

    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", `Page Number {{List1.pageNo}}`);
    cy.wait("@updateLayout");
    cy.get(commonlocators.bodyTextStyle)
      .first()
      .should("have.text", "Page Number 1");

    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    cy.get(commonlocators.bodyTextStyle)
      .first()
      .should("have.text", "Page Number 2");

    cy.openPropertyPane("listwidgetv2");
    cy.get(".t--delete-widget").click({ force: true });
  });

  it("2. List widget V2 with server side pagination", () => {
    cy.dragAndDropToCanvas("listwidgetv2", {
      x: 300,
      y: 300,
    });
    cy.openPropertyPane("listwidgetv2");

    cy.openPropertyPane("textwidget");
    cy.testJsontextclear("text");
    cy.testJsontext("text", `PageSize {{List1.pageSize}}`);
    cy.wait("@updateLayout");

    cy.get(commonlocators.bodyTextStyle)
      .first()
      .should("have.text", "PageSize 3");

    // toggle serversidepagination -> true
    cy.openPropertyPane("listwidgetv2");
    cy.togglebar(".t--property-control-serversidepagination input");

    cy.get(commonlocators.bodyTextStyle)
      .first()
      .should("have.text", "PageSize 2");
  });

  it("3. should reset page no if higher than max when switched from server side to client side", () => {
    cy.addDsl(dslWithServerSide);
    // Open Datasource editor
    cy.wait(2000);
    cy.NavigateToDatasourceEditor();

    // Click on sample(mock) user database.
    cy.get(datasource.mockUserDatabase).click();

    // Choose the first data source which consists of users keyword & Click on the "New Query +"" button
    cy.get(`${datasource.datasourceCard}`)
      .filter(":contains('Users')")
      .first()
      .within(() => {
        cy.get(`${datasource.createQuery}`).click({ force: true });
      });

    // Click the editing field
    cy.get(".t--action-name-edit-field").click({ force: true });

    // Click the editing field
    cy.get(queryLocators.queryNameField).type("Query1");

    // switching off Use Prepared Statement toggle
    cy.get(queryLocators.switch).last().click({ force: true });

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

    // Click next page in list widget
    cy.get(".t--list-widget-next-page")
      .find("button")
      .click({ force: true })
      .wait(1000);

    // Change to client side pagination
    cy.openPropertyPane("listwidgetv2");
    cy.togglebarDisable(".t--property-control-serversidepagination input");

    cy.wait(2000);

    cy.get(".t--widget-containerwidget").should("have.length", 3);
  });
});
