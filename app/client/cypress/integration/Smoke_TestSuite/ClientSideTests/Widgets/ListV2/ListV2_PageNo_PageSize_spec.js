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

    cy.openPropertyPane("listwidgetv2");
    cy.get(".t--delete-widget").click({ force: true });
  });

  it("2. List widget V2 with server side pagination", () => {
    cy.dragAndDropToCanvas("listwidgetv2", {
      x: 300,
      y: 300,
    });
    cy.openPropertyPane("listwidgetv2");

    // toggle serversidepagination -> true
    cy.togglebar(".t--property-control-serversidepagination input");
    cy.wait("@updateLayout");

    // toggle js of onPageSizeChange
    cy.get(".t--property-control-onpagesizechange")
      .find(".t--js-toggle")
      .click({
        force: true,
      });
    // Bind with MultiApi with static value
    cy.testJsontext(
      "onpagesizechange",
      "{{showAlert('Page Size Changed ' + List1.pageSize)}}",
    );
    // toggle serversidepagination -> false
    cy.togglebarDisable(".t--property-control-serversidepagination input");

    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", `PageSize {{List1.pageSize}}`);
    cy.wait("@updateLayout");

    cy.get(commonlocators.bodyTextStyle)
      .first()
      .should("have.text", "PageSize 3");

    // toggle serversidepagination -> true
    cy.openPropertyPane("listwidgetv2");
    cy.togglebar(".t--property-control-serversidepagination input");
    cy.validateToastMessage("Page Size Changed 2");

    cy.get(commonlocators.bodyTextStyle)
      .first()
      .should("have.text", "PageSize 2");
  });
});
