const dsl = require("../../../../../fixtures/Listv2/Listv2DefaultSelectedItem.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

const items = JSON.parse(dsl.dsl.children[0].listData);
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

function testJsontextClear(endp) {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type(`{${modifierKey}}{a}`, { force: true })
    .type(`{${modifierKey}}{del}`, { force: true });
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
    cy.get(`${widgetSelector("Text3")} ${commonlocators.bodyTextStyle}`).then(
      (val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data).should("deep.equal", items[4]);
      },
    );

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
    cy.get(`${widgetSelector("Text3")} ${commonlocators.bodyTextStyle}`).then(
      (val) => {
        const data = JSON.parse(val.text());
        cy.wrap(data).should("deep.equal", items[0]);
      },
    );
  });
});
