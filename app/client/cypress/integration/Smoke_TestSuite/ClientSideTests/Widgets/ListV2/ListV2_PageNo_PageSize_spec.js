const dsl = require("../../../../../fixtures/listv2PaginationDsl.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

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

describe("List widget V2 page number and page size", () => {
  before(() => {
    cy.addDsl(dsl);
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
  });

  // TODO: Serverside Pagination
});
