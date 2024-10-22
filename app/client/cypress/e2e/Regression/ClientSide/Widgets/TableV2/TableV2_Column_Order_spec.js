const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 column order maintained on column change validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tableV2ColumnOrderDsl");
    });

    it("Table widget V2 column order should be maintained after reorder and new column should be at the end", function () {
      const thirdColumnSelector = `${commonlocators.TableV2Head} .tr div:nth-child(3) .draggable-header`;
      const secondColumnSelector = `${commonlocators.TableV2Head} .tr div:nth-child(2) .draggable-header`;

      cy.get(thirdColumnSelector).trigger("dragstart");
      cy.get(secondColumnSelector).trigger("drop");
      cy.get(commonlocators.switchWidgetActive)
        .click({ force: true })
        .wait(1000); //allowing time for table to rearrange
      cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
        cy.wrap(item).should(
          "contain.text",
          `Column Order: [\\"status\\",\\"task\\",\\"action\\",\\"step1\\"]`,
        );
      });
      cy.wait(1000);
      cy.get(thirdColumnSelector).trigger("dragstart");
      cy.get(secondColumnSelector).trigger("drop");
      cy.get(commonlocators.switchWidgetInActive)
        .click({ force: true })
        .wait(1000);
      cy.get(commonlocators.textWidgetContainer).each((item, index, list) => {
        cy.wrap(item).should(
          "contain.text",
          `Column Order: [\\"status\\",\\"action\\",\\"task\\",\\"step\\"]`,
        );
      });
    });
  },
);
