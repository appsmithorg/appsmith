const dsl = require("../../../../../fixtures/Listv2/ListV2WithNullPrimaryKey.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe(" Null Primary Key", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Widgets get displayed when PrimaryKey doesn't exist - SSP", () => {
    cy.wait(1000);
    cy.createAndFillApi(
      "https://api.punkapi.com/v2/beers?page={{List1.pageNo}}&per_page={{List1.pageSize}}",
      "",
    );
    cy.RunAPI();
    cy.SearchEntityandOpen("List1");
    cy.openPropertyPaneByWidgetName("Text2", "textwidget");

    cy.testJsontext("text", "{{currentIndex}}");

    cy.get(`${widgetSelector("Text2")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `0`);

    cy.get(commonlocators.listPaginateNextButton)
      .first()
      .click({
        force: true,
      });
    cy.wait(1000);

    cy.get(`${widgetSelector("Text2")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `0`);
  });

  it("Widgets get displayed when PrimaryKey doesn't exist - Client-Side Pagination", () => {
    cy.openPropertyPaneByWidgetName("Text4", "textwidget");

    cy.testJsontext("text", "{{currentIndex}}");

    cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `0`);

    cy.get(commonlocators.listPaginateNextButton)
      .eq(1)
      .click({
        force: true,
      });

    cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `1`);

    cy.get(commonlocators.listPaginateNextButton)
      .eq(1)
      .click({
        force: true,
      });

    cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `2`);
  });
});
