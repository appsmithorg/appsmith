const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableV2ColumnOrderDsl.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("Table Widget V2 column order maintained on column change validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table widget V2 column order should be maintained after reorder and new column should be at the end", function() {
    const thirdColumnSelector = `${commonlocators.TableV2Head} .tr div:nth-child(3)`;
    const secondColumnSelector = `${commonlocators.TableV2Head} .tr div:nth-child(2) .draggable-header`;

    cy.get(thirdColumnSelector).trigger("dragstart");
    cy.get(secondColumnSelector).trigger("drop");
    cy.get(commonlocators.switchWidgetActive).click({ force: true });
    cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
      cy.wrap(item).should(
        "contain.text",
        `Column Order: [\\"status\\",\\"task\\",\\"action\\",\\"step1\\"]`,
      );
    });
    cy.wait(2000);
    cy.get(thirdColumnSelector).trigger("dragstart");
    cy.get(secondColumnSelector).trigger("drop");
    cy.get(commonlocators.switchWidgetInActive).click({ force: true });
    cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
      cy.wrap(item).should(
        "contain.text",
        `Column Order: [\\"status\\",\\"action\\",\\"task\\",\\"step\\"]`,
      );
    });
  });
});
