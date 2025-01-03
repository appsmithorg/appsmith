import * as _ from '../../../../../support/Objects/ObjectsCore';

describe("List widget v1 spec", () => {
  before(() => {
    /**
     * On the canvas we have a List Widget
     */
    cy.fixture("listWidgetDsl").then((dsl: string) => {
      _.agHelper.AddDsl(dsl);
    });
  });

  it("1. Validate if the 'items', 'server-side pagination', 'Visible', 'Animate Loading' and 'OnListItemClick' properties are present in the property pane", () => {
    _.ee.SelectEntityByName("List1", "Widgets");
    _.agHelper.AssertContains("Data", "exist", "span");
    _.agHelper.AssertContains("Server Side Pagination", "exist", "label");
    _.agHelper.AssertContains("Visible", "exist", "label");
    _.agHelper.AssertContains("Animate Loading", "exist", "label");
    _.agHelper.AssertContains("onListItemClick", "exist", "label");
  });
});
