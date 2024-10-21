import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Tab widget test duplicate tab name validation",
  { tags: ["@tag.Widget", "@tag.Tab", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("tabsWidgetDsl");
    });
    it("Tab Widget Functionality Test with Modal on change of selected tab", function () {
      cy.openPropertyPane("tabswidget");
      // added duplicate tab names
      cy.tabPopertyUpdate("tab2", "TestUpdated");
      cy.tabPopertyUpdate("tab4", "TestUpdated");
      cy.get(".t--has-duplicate-label-3").should("exist");
      cy.get(".t--has-duplicate-label-4").should("not.exist");

      // detele column and re-validate duplicate column
      cy.deleteColumn("tab2");
      cy.get(".t--has-duplicate-label-3").should("not.exist");
    });
  },
);

afterEach(() => {
  // put your clean up code if any
});
