const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableV2ColumnOrderDsl.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("Table Widget V2 column order maintained on column change validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table widget V2 column order should be maintained after reorder and new column should be at the end", function() {
    cy.get(`${commonlocators.TableV2Head} .tr div:nth-child(3)`).trigger(
      "dragstart",
    );
    cy.get(
      `${commonlocators.TableV2Head} .tr div:nth-child(2) .draggable-header`,
    ).trigger("drop");
    cy.wait(2000);
    cy.get(commonlocators.switchWidgetActive).click({ force: true });
    cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
      cy.wrap(item).should(
        "contain.text",
        `Column Order: [\\"status\\",\\"task\\",\\"action\\",\\"step1\\"]`,
      );
    });
  });
});
