const dsl = require("../../../../../fixtures/Listv2/ListV2_Reset_dsl.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

const items = dsl.dsl.children[4]?.listData;

const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

function testJsontextClear(endp) {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type(`{${modifierKey}}{a}`, { force: true })
    .type(`{${modifierKey}}{del}`, { force: true });
}

const verifyDefaultItem = () => {
  cy.waitUntil(() =>
    cy
      .get(
        `${widgetSelector("SelectedItemView")} ${commonlocators.bodyTextStyle}`,
      )
      .then((val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data?.Text11?.text).should("equal", "4");
      }),
  );

  cy.get(
    `${widgetSelector("SelectedItem")} ${commonlocators.bodyTextStyle}`,
  ).then((val) => {
    const data = JSON.parse(val.text());
    cy.wrap(data?.id).should("deep.equal", 4);
  });

  cy.get(
    `${widgetSelector("SelectedItemKey")} ${commonlocators.bodyTextStyle}`,
  ).then((val) => {
    const data = JSON.parse(val.text());
    cy.wrap(data).should("deep.equal", 4);
  });
};

function setUpDataSource() {
  cy.createAndFillApi("https://api.punkapi.com/v2/beers", "");
  cy.RunAPI();
  cy.SearchEntityandOpen("List1");

  cy.wait(200);
}

describe("List widget v2 defaultSelectedItem", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Loads the Page with the default Selected Item", () => {
    // Loads to page 2
    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );
    cy.get(commonlocators.listPaginateActivePage).should("have.text", "2");
    cy.get(
      `${widgetSelector("SelectedItem")} ${commonlocators.bodyTextStyle}`,
    ).then((val) => {
      const data = JSON.parse(val.text());
      cy.wrap(data).should("deep.equal", items[4]);
    });

    //Change Default Selected Item
    cy.openPropertyPane("listwidgetv2");

    testJsontextClear("defaultselecteditem");
    cy.testJsontext("defaultselecteditem", "001");

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );

    cy.get(commonlocators.listPaginateActivePage).should("have.text", "1");
    cy.get(
      `${widgetSelector("SelectedItem")} ${commonlocators.bodyTextStyle}`,
    ).then((val) => {
      const data = JSON.parse(val.text());
      cy.wrap(data).should("deep.equal", items[0]);
    });
  });

  it("2. use query data", () => {
    // Create sample(mock) user database.
    setUpDataSource();

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );

    //Change Default Selected Item
    cy.openPropertyPane("listwidgetv2");

    testJsontextClear("items");
    cy.testJsontext("items", "{{Api1.data}}");

    testJsontextClear("defaultselecteditem");
    cy.testJsontext("defaultselecteditem", "4");

    cy.waitUntil(() =>
      cy.get(commonlocators.listPaginateActivePage).should("have.text", "2"),
    );

    cy.get(
      `${widgetSelector("SelectedItem")} ${commonlocators.bodyTextStyle}`,
    ).then((val) => {
      const data = JSON.parse(val.text());
      cy.wrap(data?.id).should("deep.equal", 4);
    });

    // In view Mode

    cy.PublishtheApp();

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );

    cy.get(commonlocators.listPaginateActivePage).should("have.text", "2");
    cy.get(
      `${widgetSelector("SelectedItem")} ${commonlocators.bodyTextStyle}`,
    ).then((val) => {
      const data = JSON.parse(val.text());
      cy.wrap(data?.id).should("deep.equal", 4);
    });
    cy.get(publishPage.backToEditor).click({ force: true });
  });
});

describe("List widget v2 Reset List widget and Refresh Data", () => {
  it("1. Setup List Widget", () => {
    cy.openPropertyPane("listwidgetv2");
    testJsontextClear("defaultselecteditem");
    cy.testJsontext("defaultselecteditem", "4");

    cy.waitUntil(() =>
      cy.get(commonlocators.listPaginateActivePage).should("have.text", "2"),
    );

    verifyDefaultItem();
  });

  it("2. Reset List Widget", () => {
    // Select a new List Item on another page
    cy.get(`${widgetSelector("List1")} .rc-pagination-item-1`).click({
      force: true,
    });

    cy.waitUntil(() =>
      cy.get(commonlocators.listPaginateActivePage).should("have.text", "1"),
    );

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(0)
      .click({ force: true });

    cy.wait(400);

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector("SelectedItem")} ${commonlocators.bodyTextStyle}`,
        )
        .then((val) => {
          const data = JSON.parse(val.text());
          cy.wrap(data?.id).should("deep.equal", 1);
        }),
    );

    cy.get(`${widgetSelector("ResetWidget")} button`).click({ force: true });

    cy.waitUntil(() =>
      cy.get(commonlocators.listPaginateActivePage).should("have.text", "2"),
    );

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );

    cy.wait(200);

    verifyDefaultItem();

    //Move to another page and verify the value is cached.
    cy.get(`${widgetSelector("List1")} .rc-pagination-item-4`).click({
      force: true,
    });

    cy.waitUntil(() =>
      cy.get(commonlocators.listPaginateActivePage).should("have.text", "4"),
    );

    verifyDefaultItem();

    // Refresh Data and see the Default Item remains the same
    cy.get(`${widgetSelector("RefreshData")} button`).click({
      force: true,
    });

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 3),
    );
    cy.wait(200);

    verifyDefaultItem();

    // Select another container on the Same Page and reset the list widget

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector} `)
      .last()
      .click({ force: true });

    cy.wait(500);

    cy.get(`${widgetSelector("ResetWidget")} button`).click({ force: true });

    cy.wait(500);

    verifyDefaultItem();
  });
});
