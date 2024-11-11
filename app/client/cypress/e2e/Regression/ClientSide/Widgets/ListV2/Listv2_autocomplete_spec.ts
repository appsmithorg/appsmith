const level3NestedList = require("../../../../../fixtures/Listv2/level3NestedList.json");

function checkAutosuggestion(label, type) {
  cy.get(".CodeMirror-hints")
    .contains(label)
    .then(($el) => {
      const after = getComputedStyle($el[0], "::after");
      const afterContent = after.getPropertyValue("content");
      expect(afterContent).eq(`"${type}"`);
    });
}

describe(
  "List v2 - Property autocomplete",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
    before(() => {
      cy.addDsl(level3NestedList);
    });

    it("1. shows autocomplete for currentItem/currentIndex/currentView for level_1 list", () => {
      // Open the property pane of level 1 list widget's Text widget
      cy.openPropertyPaneByWidgetName("Text1", "textwidget");

      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type("{{curr", {
        force: true,
      });
      checkAutosuggestion("currentItem", "Object");
      checkAutosuggestion("currentView", "Object");
      checkAutosuggestion("currentIndex", "Number");
    });

    it("2. shows autocomplete for currentItem/currentIndex/currentView for level_2 list", () => {
      // Open the property pane of level 2 list widget's Text widget
      cy.openPropertyPaneByWidgetName("Text5", "textwidget");

      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type("{{curr", {
        force: true,
      });
      checkAutosuggestion("currentItem", "Object");
      checkAutosuggestion("currentView", "Object");
      checkAutosuggestion("currentIndex", "Number");
    });

    it("3. shows autocomplete for level_1's currentItem/currentIndex/currentView for level_2 list", () => {
      // Open the property pane of level 2 list widget's Text widget
      cy.openPropertyPaneByWidgetName("Text5", "textwidget");

      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{level_1.",
        { force: true },
      );
      checkAutosuggestion("currentItem", "Object");
      checkAutosuggestion("currentView", "Object");
      checkAutosuggestion("currentIndex", "Number");
    });

    it("4. shows autocomplete for currentItem/currentIndex/currentView for level_3 list", () => {
      // Open the property pane of level 3 list widget's Text widget
      cy.openPropertyPaneByWidgetName("Text7", "textwidget");

      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type("{{curr", {
        force: true,
      });
      checkAutosuggestion("currentItem", "Object");
      checkAutosuggestion("currentView", "Object");
      checkAutosuggestion("currentIndex", "Number");
    });

    it("5. shows autocomplete for level_1's currentItem/currentIndex/currentView for level_3 list", () => {
      // Open the property pane of level 3 list widget's Text widget
      cy.openPropertyPaneByWidgetName("Text7", "textwidget");

      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{level_1.",
        { force: true },
      );
      checkAutosuggestion("currentItem", "Object");
      checkAutosuggestion("currentView", "Object");
      checkAutosuggestion("currentIndex", "Number");
    });

    it("6. shows autocomplete for level_2's currentItem/currentIndex/currentView for level_3 list", () => {
      // Open the property pane of level 3 list widget's Text widget
      cy.openPropertyPaneByWidgetName("Text7", "textwidget");

      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{level_2.",
        { force: true },
      );
      checkAutosuggestion("currentItem", "Object");
      checkAutosuggestion("currentView", "Object");
      checkAutosuggestion("currentIndex", "Number");
    });

    it("7. should not show List's currentItemsView in currentView of level_1/level_2 properties", () => {
      // Open the property pane of level 3 list widget's Text widget
      cy.openPropertyPaneByWidgetName("Text7", "textwidget");

      // level_1 List currentItemsView should not exist
      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{level_1.currentView.List2.",
        { force: true },
      );
      cy.get(".CodeMirror-hints")
        .contains("currentItemsView")
        .should("not.exist");

      // level_2 List currentItemsView should not exist
      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{level_2.currentView.List3.",
        { force: true },
      );
      cy.get(".CodeMirror-hints")
        .contains("currentItemsView")
        .should("not.exist");
    });

    it("8. currentItem should reflect appropriate data types", () => {
      // Open the property pane of level 1 list widget's Text widget
      cy.openPropertyPaneByWidgetName("Text1", "textwidget");

      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{currentItem.",
        { force: true },
      );
      checkAutosuggestion("companyName", "String");
      checkAutosuggestion("id", "Number");
      checkAutosuggestion("location", "String");
      checkAutosuggestion("positions", "Array");
    });

    it("9. currentView should reflect appropriate widgets for level_1 for level_3 list", () => {
      // Open the property pane of level 3 list widget's Text widget
      cy.openPropertyPaneByWidgetName("Text6", "textwidget");

      // level_1.currentView
      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{level_1.currentView.",
        { force: true },
      );
      checkAutosuggestion("Text1", "Object");
      checkAutosuggestion("Text2", "Object");
      checkAutosuggestion("List2", "Object");

      // level_1.currentView.Text1
      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{level_1.currentView.Text1.",
        { force: true },
      );
      checkAutosuggestion("text", "String");
      checkAutosuggestion("isVisible", "Boolean");

      // level_1.currentView.Text2
      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{level_1.currentView.Text2.",
        { force: true },
      );
      checkAutosuggestion("text", "String");
      checkAutosuggestion("isVisible", "Boolean");

      // level_1.currentView.List2
      cy.testJsontext("text", "");
      cy.get(".t--property-control-text .CodeMirror textarea").type(
        "{{level_1.currentView.List2.",
        { force: true },
      );
      checkAutosuggestion("backgroundColor", "String");
      checkAutosuggestion("itemSpacing", "Number");
      checkAutosuggestion("isVisible", "Boolean");
      checkAutosuggestion("listData", "Array");
      checkAutosuggestion("pageNo", "Number");
      checkAutosuggestion("pageSize", "Number");
    });
  },
);
