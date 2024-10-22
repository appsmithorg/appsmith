const simpleListDSL = require("../../../../../fixtures/Listv2/simpleList.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

describe(
  "Listv2 - Container widget",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
    before(() => {
      cy.addDsl(simpleListDSL);
    });

    it("1. can open property pane of container widget", () => {
      cy.openPropertyPaneByWidgetName("Container1", "containerwidget");

      cy.get(".t--propertypane").contains("Container1");
    });

    it("2. currentItem can be used in the container", () => {
      const colors = ["rgb(0, 0, 255)", "rgb(0, 128, 0)", "rgb(255, 0, 0)"];

      cy.openPropertyPaneByWidgetName("Container1", "containerwidget");

      // Open style table
      cy.get(commonlocators.propertyStyle).first().click({ force: true });

      cy.get(".t--property-control-backgroundcolor")
        .find(".t--js-toggle")
        .click();

      cy.testJsontext("backgroundcolor", "{{currentItem.name}}");

      cy.get('div[type="CONTAINER_WIDGET"]').each(($el, index) => {
        cy.wrap($el).should("have.css", "background-color", colors[index]);
      });
    });
  },
);
