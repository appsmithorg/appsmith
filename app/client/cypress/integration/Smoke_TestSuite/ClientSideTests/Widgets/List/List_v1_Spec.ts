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
    _.agHelper.AssertElementVisible(_.locators._listWidgetItemsDatalabel);
    _.agHelper.AssertElementVisible(_.locators._listWidgetPaginationlabel);
    _.agHelper.AssertElementVisible(_.locators._listWidgetVisiblelabel);
    _.agHelper.AssertElementVisible(_.locators._listWidgetAnimateLoadinglabel);
    _.agHelper.AssertElementVisible(_.locators._listWidgetClickEventlabel);
  });
});
