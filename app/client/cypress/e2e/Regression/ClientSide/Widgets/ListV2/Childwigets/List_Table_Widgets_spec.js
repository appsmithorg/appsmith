import * as _ from "../../../../../../support/Objects/ObjectsCore";
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

describe("Select Widgets", { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] }, function () {
  before(() => {
    _.agHelper.AddDsl("Listv2/Listv2WithTablewidget");
  });
  it("a. Validate the Values in Table widget", function () {
    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(0)
      .within(() => {
        cy.readTableV2dataPublish("0", "1").then((tabData) => {
          const tabValue = tabData;
          expect(tabValue).to.be.equal("Blue");
          cy.log("the value is" + tabValue);
        });

        cy.readTableV2dataPublish("3", "1").then((tabData) => {
          const tabValue = tabData;
          expect(tabValue).to.be.equal("White");
          cy.log("the value is" + tabValue);
        });
      });

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(1)
      .within(() => {
        cy.readTableV2dataPublish("0", "1").then((tabData) => {
          const tabValue = tabData;
          expect(tabValue).to.be.equal("Orange");
        });

        cy.readTableV2dataPublish("3", "1").then((tabData) => {
          const tabValue = tabData;
          expect(tabValue).to.be.equal("Mustard");
        });
      });

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(2)
      .within(() => {
        cy.readTableV2dataPublish("0", "1").then((tabData) => {
          const tabValue = tabData;
          expect(tabValue).to.be.equal("Teal");
        });

        cy.readTableV2dataPublish("3", "1").then((tabData) => {
          const tabValue = tabData;
          expect(tabValue).to.be.equal("Marine");
        });
      });

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
      .eq(3)
      .within(() => {
        cy.readTableV2dataPublish("0", "1").then((tabData) => {
          const tabValue = tabData;
          expect(tabValue).to.be.equal("Blue");
        });

        cy.readTableV2dataPublish("3", "1").then((tabData) => {
          const tabValue = tabData;
          expect(tabValue).to.be.equal("Lavender");
        });
      });
  });
});
